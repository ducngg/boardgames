from __future__ import annotations

from collections import Counter
import asyncio
import random
import secrets
import time
from typing import Any, Dict, List, Optional, Tuple

from fastapi import WebSocket

from .models import (
    ALL_ROLES,
    CALL_ORDER,
    DEFAULT_DISCUSSION_TIMER_SECONDS,
    MAX_DISCUSSION_TIMER_SECONDS,
    MAX_ROLE_TIMER_SECONDS,
    MIN_DISCUSSION_TIMER_SECONDS,
    MIN_ROLE_TIMER_SECONDS,
    ROLE_CONSTRAINTS,
    ROLES_THAT_DO_NOT_WAKE,
    Player,
    Room,
)


class GameError(Exception):
    pass


class WerewolfHub:
    def __init__(self) -> None:
        self.rooms: Dict[str, Room] = {}
        self.connections: Dict[str, Dict[str, WebSocket]] = {}
        self._lock = asyncio.Lock()

    def normalize_room_id(self, room_id: str) -> str:
        cleaned = "".join(ch for ch in room_id.lower().strip() if ch.isalnum() or ch in {"-", "_"})
        return cleaned[:24] or "main-room"

    def normalize_name(self, name: str) -> str:
        trimmed = " ".join(name.strip().split())
        return (trimmed or "Player")[:24]

    def _new_player_id(self) -> str:
        return secrets.token_hex(6)

    async def connect(
        self,
        room_id: str,
        player_name: str,
        player_id: Optional[str],
        websocket: WebSocket,
    ) -> Tuple[Room, Player]:
        async with self._lock:
            room = self.rooms.setdefault(room_id, Room(id=room_id))
            player: Optional[Player] = None

            if player_id and player_id in room.players:
                player = room.players[player_id]
                player.connected = True
                player.name = player_name
            else:
                if room.phase != "lobby":
                    raise GameError("Cannot join a room after the game has started. Wait for reset.")
                if len(room.players) >= room.max_players:
                    raise GameError("Room is full. Maximum is 12 players.")

                created_player_id = self._new_player_id()
                player = Player(
                    id=created_player_id,
                    name=player_name,
                    is_host=len(room.players) == 0,
                    connected=True,
                )
                room.players[player.id] = player
                room.notes[player.id] = ["You joined the lobby."]

            self.connections.setdefault(room_id, {})[player.id] = websocket
            self._ensure_host_exists(room)
            return room, player

    async def disconnect(self, room_id: str, player_id: str) -> None:
        async with self._lock:
            room_connections = self.connections.get(room_id)
            if room_connections is not None:
                room_connections.pop(player_id, None)

            room = self.rooms.get(room_id)
            if room and player_id in room.players:
                room.players[player_id].connected = False

    async def list_rooms(self) -> List[Dict[str, Any]]:
        async with self._lock:
            return [self._public_room_summary(room) for room in self.rooms.values()]

    async def get_room_summary(self, room_id: str) -> Optional[Dict[str, Any]]:
        async with self._lock:
            room = self.rooms.get(room_id)
            if room is None:
                return None
            return self._public_room_summary(room)

    async def process_message(self, room_id: str, player_id: str, message: Dict[str, Any]) -> None:
        if not isinstance(message, dict):
            raise GameError("Invalid websocket message payload.")

        message_type = message.get("type")
        async with self._lock:
            room = self.rooms.get(room_id)
            if room is None:
                raise GameError("Room not found.")
            if player_id not in room.players:
                raise GameError("Player does not belong to this room.")

            if message_type == "configure_roles":
                self._configure_roles(room, player_id, message)
            elif message_type == "start_game":
                self._start_game(room, player_id)
            elif message_type == "night_action":
                self._submit_night_action(room, player_id, message)
            elif message_type == "vote":
                self._submit_vote(room, player_id, message)
            elif message_type == "chat":
                self._add_chat(room, player_id, message)
            elif message_type == "reset_game":
                self._reset_game(room, player_id)
            elif message_type == "set_name":
                self._set_name(room, player_id, message)
            elif message_type == "ping":
                return
            else:
                raise GameError("Unknown message type.")

    async def tick_role_timers(self) -> List[str]:
        timed_out_rooms: List[str] = []
        async with self._lock:
            now = time.time()
            for room in self.rooms.values():
                if room.phase != "night":
                    continue
                if room.active_role_deadline is None:
                    continue
                if now >= room.active_role_deadline:
                    self._timeout_current_role(room)
                    timed_out_rooms.append(room.id)
        return timed_out_rooms

    async def broadcast_room_state(self, room_id: str) -> None:
        async with self._lock:
            room = self.rooms.get(room_id)
            if room is None:
                return

            room_connections = list(self.connections.get(room_id, {}).items())
            payloads: Dict[str, Dict[str, Any]] = {}
            for connected_player_id, _ in room_connections:
                if connected_player_id in room.players:
                    payloads[connected_player_id] = {
                        "type": "state",
                        "state": self._state_for_player(room, connected_player_id),
                    }

        stale_ids: List[str] = []
        for connected_player_id, websocket in room_connections:
            payload = payloads.get(connected_player_id)
            if payload is None:
                continue
            try:
                await websocket.send_json(payload)
            except Exception:
                stale_ids.append(connected_player_id)

        if stale_ids:
            async with self._lock:
                room = self.rooms.get(room_id)
                room_connections = self.connections.get(room_id, {})
                for stale_player_id in stale_ids:
                    room_connections.pop(stale_player_id, None)
                    if room and stale_player_id in room.players:
                        room.players[stale_player_id].connected = False

    def _ensure_host_exists(self, room: Room) -> None:
        hosts = [player for player in room.players.values() if player.is_host]
        if hosts:
            return
        if room.players:
            first_player_id = next(iter(room.players))
            room.players[first_player_id].is_host = True

    def _require_host(self, room: Room, player_id: str) -> None:
        player = room.players[player_id]
        if not player.is_host:
            raise GameError("Only the host can do that.")

    def _parse_int(self, raw_value: Any, field_name: str) -> int:
        if isinstance(raw_value, bool):
            raise GameError(f"{field_name} must be an integer.")
        if isinstance(raw_value, int):
            return raw_value
        if isinstance(raw_value, str):
            stripped = raw_value.strip()
            if stripped.startswith("-") and stripped[1:].isdigit():
                return int(stripped)
            if stripped.isdigit():
                return int(stripped)
        raise GameError(f"{field_name} must be an integer.")

    def _normalize_role_config(self, raw_roles: Any) -> Dict[str, int]:
        if not isinstance(raw_roles, dict):
            raise GameError("Roles configuration must be an object.")

        unknown_roles = [role_name for role_name in raw_roles if role_name not in ROLE_CONSTRAINTS]
        if unknown_roles:
            raise GameError(f"Unknown role(s): {', '.join(sorted(unknown_roles))}.")

        normalized: Dict[str, int] = {}
        for role in ALL_ROLES:
            raw_count = raw_roles.get(role, 0)
            count = self._parse_int(raw_count, f"Count for role {role}")
            role_limits = ROLE_CONSTRAINTS[role]
            if count < role_limits["min"] or count > role_limits["max"]:
                raise GameError(
                    f"Role {role} must be between {role_limits['min']} and {role_limits['max']}."
                )
            normalized[role] = count

        return normalized

    def _normalize_timer_seconds(self, raw_timer: Any, fallback: int) -> int:
        if raw_timer is None:
            return fallback

        timer_seconds = self._parse_int(raw_timer, "timer_seconds")
        if timer_seconds < MIN_ROLE_TIMER_SECONDS or timer_seconds > MAX_ROLE_TIMER_SECONDS:
            raise GameError(
                f"timer_seconds must be between {MIN_ROLE_TIMER_SECONDS} and {MAX_ROLE_TIMER_SECONDS}."
            )
        return timer_seconds

    def _normalize_discussion_timer_seconds(self, raw_timer: Any, fallback: int) -> int:
        if raw_timer is None:
            return fallback

        timer_seconds = self._parse_int(raw_timer, "discussion_timer_seconds")
        if timer_seconds < MIN_DISCUSSION_TIMER_SECONDS or timer_seconds > MAX_DISCUSSION_TIMER_SECONDS:
            raise GameError(
                (
                    "discussion_timer_seconds must be between "
                    f"{MIN_DISCUSSION_TIMER_SECONDS} and {MAX_DISCUSSION_TIMER_SECONDS}."
                )
            )
        return timer_seconds

    def _configure_roles(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        self._require_host(room, player_id)
        if room.phase != "lobby":
            raise GameError("Roles can only be configured while in lobby.")

        normalized_roles = self._normalize_role_config(message.get("roles"))
        timer_seconds = self._normalize_timer_seconds(
            message.get("timer_seconds"),
            room.role_timer_seconds,
        )
        discussion_timer_seconds = self._normalize_discussion_timer_seconds(
            message.get("discussion_timer_seconds"),
            room.discussion_timer_seconds,
        )

        room.configured_roles = normalized_roles
        room.role_timer_seconds = timer_seconds
        room.discussion_timer_seconds = discussion_timer_seconds

        room.notes.setdefault(player_id, []).append(
            f"Role config saved. Total roles: {room.configured_role_total}."
        )

    def _start_blockers(self, room: Room) -> List[str]:
        blockers: List[str] = []
        expected_roles = len(room.players) + 3

        if len(room.players) < 3:
            blockers.append("Need at least 3 players to start.")

        if room.configured_role_total == 0:
            blockers.append("Role configuration is empty.")

        if room.configured_role_total != expected_roles:
            blockers.append("Total configured roles must equal current player count + 3.")

        for role, limits in ROLE_CONSTRAINTS.items():
            count = room.configured_roles.get(role, 0)
            if count < limits["min"] or count > limits["max"]:
                blockers.append(
                    f"Role {role} must be between {limits['min']} and {limits['max']}."
                )

        return blockers

    def _start_game(self, room: Room, player_id: str) -> None:
        self._require_host(room, player_id)
        if room.phase != "lobby":
            raise GameError("Game has already started.")

        blockers = self._start_blockers(room)
        if blockers:
            raise GameError(blockers[0])

        role_pool: List[str] = []
        for role in ALL_ROLES:
            role_pool.extend([role] * room.configured_roles.get(role, 0))

        player_ids = room.player_ids()
        if len(role_pool) != len(player_ids) + 3:
            raise GameError("Configured roles must exactly match number of players + 3.")

        random.shuffle(role_pool)

        room.original_roles.clear()
        room.current_roles.clear()
        room.center_cards.clear()
        room.votes.clear()
        room.result = None
        room.pending_actions.clear()
        room.action_history.clear()
        room.turn_index = 0
        room.phase = "night"
        room.chat_log.clear()
        room.active_role_started_at = None
        room.active_role_deadline = None
        room.discussion_deadline = None
        room.night_order = [role for role in CALL_ORDER if room.configured_roles.get(role, 0) > 0]

        for index, assigned_player_id in enumerate(player_ids):
            role = role_pool[index]
            room.players[assigned_player_id].original_role = role
            room.original_roles[assigned_player_id] = role
            room.current_roles[assigned_player_id] = role

        room.center_cards = role_pool[len(player_ids):]
        if len(room.center_cards) != 3:
            raise GameError("Exactly 3 center cards are required.")

        room.notes = {
            assigned_player_id: [
                f"Original role: {room.original_roles[assigned_player_id]}.",
                "Night started.",
            ]
            for assigned_player_id in player_ids
        }

        self._add_system_chat(room, "Night started. Follow the wake-up order.")
        self._advance_night(room)

    def _advance_night(self, room: Room) -> None:
        room.pending_actions.clear()
        room.active_role_started_at = None
        room.active_role_deadline = None

        while room.phase == "night":
            if room.turn_index >= len(room.night_order):
                room.phase = "day"
                room.pending_actions.clear()
                room.active_role_started_at = None
                room.active_role_deadline = None
                room.discussion_deadline = time.time() + room.discussion_timer_seconds
                self._add_system_chat(room, "Day phase started. Vote for who to eliminate.")
                return

            role = room.night_order[room.turn_index]
            actors = [player_id for player_id, assigned_role in room.original_roles.items() if assigned_role == role]

            now = time.time()
            room.active_role_started_at = now
            room.active_role_deadline = now + room.role_timer_seconds
            self._add_system_chat(room, f"{role} turn started ({room.role_timer_seconds}s).")
            self._add_action_history(room, f"{role} turn started.")

            if not actors:
                self._add_action_history(room, f"No active player had role {role}.")
                return

            if role == "Werewolf":
                self._start_werewolf_turn(room, actors)
                return

            if role == "Minion":
                werewolves = self._players_with_original_role(room, "Werewolf")
                werewolf_names = self._name_list(room, werewolves)
                for actor in actors:
                    if werewolves:
                        room.notes.setdefault(actor, []).append(f"Werewolves are: {werewolf_names}.")
                        self._add_action_history(
                            room,
                            f"{room.players[actor].name} (Minion) saw werewolves: {werewolf_names}.",
                        )
                    else:
                        room.notes.setdefault(actor, []).append("There are no werewolves in play.")
                        self._add_action_history(
                            room,
                            f"{room.players[actor].name} (Minion) saw no werewolves.",
                        )
                return

            if role == "Mason":
                for actor in actors:
                    others = [player_id for player_id in actors if player_id != actor]
                    if others:
                        room.notes.setdefault(actor, []).append(
                            f"Other mason(s): {self._name_list(room, others)}."
                        )
                        self._add_action_history(
                            room,
                            f"{room.players[actor].name} (Mason) saw: {self._name_list(room, others)}.",
                        )
                    else:
                        room.notes.setdefault(actor, []).append("You are the only mason.")
                        self._add_action_history(
                            room,
                            f"{room.players[actor].name} (Mason) was alone.",
                        )
                return

            if role == "Insomniac":
                for actor in actors:
                    final_role = room.current_roles.get(actor, room.original_roles[actor])
                    room.notes.setdefault(actor, []).append(
                        f"Insomniac check: your final role is {final_role}."
                    )
                    self._add_action_history(
                        room,
                        f"{room.players[actor].name} (Insomniac) saw final role: {final_role}.",
                    )
                return

            room.pending_actions = self._pending_actions_for_role(room, role, actors)
            for actor in actors:
                room.notes.setdefault(actor, []).append(self._prompt_for_action_role(role, room))
            return

    def _pending_actions_for_role(self, room: Room, role: str, actors: List[str]) -> set[str]:
        if role == "Drunk" and not room.center_cards:
            for actor in actors:
                room.notes.setdefault(actor, []).append("No center cards configured. Drunk has no action.")
            return set()

        return set(actors)

    def _start_werewolf_turn(self, room: Room, actors: List[str]) -> None:
        if len(actors) > 1:
            for actor in actors:
                others = [player_id for player_id in actors if player_id != actor]
                room.notes.setdefault(actor, []).append(
                    f"Other werewolves: {self._name_list(room, others)}."
                )
            self._add_action_history(room, f"Werewolves in play: {self._name_list(room, actors)}.")
            room.pending_actions.clear()
            return

        lone_wolf = actors[0]
        if room.center_cards:
            room.notes.setdefault(lone_wolf, []).append(
                "You are the only werewolf. You may peek one center card."
            )
            room.pending_actions = {lone_wolf}
            return

        room.notes.setdefault(lone_wolf, []).append(
            "You are the only werewolf. No center card is available to peek."
        )
        self._add_action_history(
            room,
            f"{room.players[lone_wolf].name} was lone Werewolf and had no center card to peek.",
        )
        room.pending_actions.clear()

    def _prompt_for_action_role(self, role: str, room: Room) -> str:
        if role == "Seer" and len(room.center_cards) < 2:
            return "Choose one player to inspect."
        if role == "Drunk" and not room.center_cards:
            return "No center cards configured. Drunk has no action."

        prompts = {
            "Doppelganger": "Choose one player to copy.",
            "Werewolf": "Choose one center card to peek.",
            "Seer": "Choose one player to inspect OR two center cards.",
            "Robber": "Choose one player to rob (swap roles).",
            "Troublemaker": "Choose two players to swap.",
            "Drunk": "Choose one center card to swap with (you will not see it).",
        }
        return prompts.get(role, f"{role} is active.")

    def _timeout_current_role(self, room: Room) -> None:
        role = room.turn_role
        if role is None:
            return

        if room.pending_actions:
            pending_names = self._name_list(room, list(room.pending_actions))
            for player_id in room.pending_actions:
                room.notes.setdefault(player_id, []).append(
                    f"{role} timer ended. Your action was skipped."
                )
            self._add_system_chat(room, f"{role} timer ended. Skipped: {pending_names}.")
            self._add_action_history(room, f"{role} timer ended. Skipped: {pending_names}.")
        else:
            self._add_system_chat(room, f"{role} timer ended.")
            self._add_action_history(room, f"{role} timer ended.")

        room.pending_actions.clear()
        room.turn_index += 1
        room.active_role_started_at = None
        room.active_role_deadline = None
        self._advance_night(room)

    def _submit_night_action(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        if room.phase != "night":
            raise GameError("Night actions are only allowed during night.")
        if player_id not in room.pending_actions:
            raise GameError("It is not your turn to act.")
        if room.active_role_deadline is not None and time.time() > room.active_role_deadline:
            raise GameError("This role timer has ended.")

        role = room.turn_role
        if role is None:
            raise GameError("No active night role.")

        if role == "Doppelganger":
            self._action_doppelganger(room, player_id, message)
        elif role == "Werewolf":
            self._action_werewolf(room, player_id, message)
        elif role == "Seer":
            self._action_seer(room, player_id, message)
        elif role == "Robber":
            self._action_robber(room, player_id, message)
        elif role == "Troublemaker":
            self._action_troublemaker(room, player_id, message)
        elif role == "Drunk":
            self._action_drunk(room, player_id, message)
        else:
            raise GameError(f"Role {role} does not accept actions.")

        room.pending_actions.discard(player_id)
        if not room.pending_actions:
            self._add_system_chat(room, f"All actions submitted for {role}. Waiting for timer.")

    def _action_doppelganger(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        target_id = self._require_player_target(room, message, player_id, key="target_player_id")
        copied_role = room.original_roles[target_id]
        room.current_roles[player_id] = copied_role
        room.notes.setdefault(player_id, []).append(
            f"You copied {room.players[target_id].name} and became {copied_role}."
        )
        room.notes[player_id].append("Simplified rule: copied role does not perform extra wake-up action.")
        self._add_action_history(
            room,
            f"{room.players[player_id].name} (Doppelganger) copied {room.players[target_id].name} and became {copied_role}.",
        )

    def _action_werewolf(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        werewolves = self._players_with_original_role(room, "Werewolf")
        if len(werewolves) != 1 or werewolves[0] != player_id:
            raise GameError("Werewolf action is only for a lone werewolf.")
        if not room.center_cards:
            raise GameError("No center cards configured.")

        index = self._require_center_index(room, message)
        center_role = room.center_cards[index]
        room.notes.setdefault(player_id, []).append(f"Center card #{index + 1} is {center_role}.")
        self._add_action_history(
            room,
            f"{room.players[player_id].name} (Werewolf) viewed center #{index + 1}: {center_role}.",
        )

    def _action_seer(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        target_player_id = message.get("target_player_id")
        center_indices = message.get("center_indices")

        if target_player_id and center_indices:
            raise GameError("Seer action must be either player OR center cards, not both.")

        if target_player_id:
            if target_player_id == player_id:
                raise GameError("Seer cannot inspect themselves.")
            if target_player_id not in room.players:
                raise GameError("Unknown player target.")

            viewed_role = room.current_roles[target_player_id]
            room.notes.setdefault(player_id, []).append(
                f"Seer saw {room.players[target_player_id].name}: {viewed_role}."
            )
            self._add_action_history(
                room,
                f"{room.players[player_id].name} (Seer) viewed {room.players[target_player_id].name}: {viewed_role}.",
            )
            return

        if len(room.center_cards) < 2:
            raise GameError("Seer must inspect a player because no center cards are configured.")

        if not isinstance(center_indices, list) or len(center_indices) != 2:
            raise GameError("Seer must choose exactly two center card indices.")

        if center_indices[0] == center_indices[1]:
            raise GameError("Seer center card choices must be different.")

        indices = [
            self._validate_center_index(index, len(room.center_cards))
            for index in center_indices
        ]
        first_role = room.center_cards[indices[0]]
        second_role = room.center_cards[indices[1]]
        room.notes.setdefault(player_id, []).append(
            f"Seer saw center #{indices[0] + 1}: {first_role}; center #{indices[1] + 1}: {second_role}."
        )
        self._add_action_history(
            room,
            (
                f"{room.players[player_id].name} (Seer) viewed center #{indices[0] + 1}: {first_role} "
                f"and center #{indices[1] + 1}: {second_role}."
            ),
        )

    def _action_robber(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        target_id = self._require_player_target(room, message, player_id, key="target_player_id")

        player_role = room.current_roles[player_id]
        target_role = room.current_roles[target_id]

        room.current_roles[player_id] = target_role
        room.current_roles[target_id] = player_role

        room.notes.setdefault(player_id, []).append(
            f"You robbed {room.players[target_id].name} and your new role is {target_role}."
        )
        self._add_action_history(
            room,
            f"{room.players[player_id].name} (Robber) swapped with {room.players[target_id].name} and became {target_role}.",
        )

    def _action_troublemaker(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        target_a = message.get("target_a")
        target_b = message.get("target_b")

        if not isinstance(target_a, str) or not isinstance(target_b, str):
            raise GameError("Troublemaker requires two player targets.")
        if target_a == target_b:
            raise GameError("Troublemaker targets must be different players.")
        if target_a == player_id or target_b == player_id:
            raise GameError("Troublemaker cannot target themselves.")
        if target_a not in room.players or target_b not in room.players:
            raise GameError("Troublemaker target not found.")

        role_a = room.current_roles[target_a]
        role_b = room.current_roles[target_b]
        room.current_roles[target_a] = role_b
        room.current_roles[target_b] = role_a

        room.notes.setdefault(player_id, []).append(
            f"You swapped {room.players[target_a].name} and {room.players[target_b].name}."
        )
        self._add_action_history(
            room,
            f"{room.players[player_id].name} (Troublemaker) swapped {room.players[target_a].name} and {room.players[target_b].name}.",
        )

    def _action_drunk(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        if not room.center_cards:
            raise GameError("No center cards configured. Drunk has no action.")

        index = self._require_center_index(room, message)
        player_role = room.current_roles[player_id]
        center_role = room.center_cards[index]

        room.current_roles[player_id] = center_role
        room.center_cards[index] = player_role

        room.notes.setdefault(player_id, []).append(
            f"You swapped with center card #{index + 1}. (You do not see your new role.)"
        )
        self._add_action_history(
            room,
            f"{room.players[player_id].name} (Drunk) swapped with center #{index + 1} and became {room.current_roles[player_id]}.",
        )

    def _submit_vote(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        if room.phase != "day":
            raise GameError("Voting is only allowed during day.")

        target = message.get("target_player_id")
        if target is not None and target != "" and target not in room.players:
            raise GameError("Vote target is not in this room.")

        room.votes[player_id] = target if target else None

        if len(room.votes) == len(room.players):
            self._resolve_votes(room)

    def _resolve_votes(self, room: Room) -> None:
        vote_counter = Counter(target for target in room.votes.values() if target)
        eliminated: List[str] = []

        if vote_counter:
            max_votes = max(vote_counter.values())
            eliminated = [player_id for player_id, count in vote_counter.items() if count == max_votes]

        hunter_bonus: List[str] = []
        for eliminated_id in eliminated:
            if room.current_roles.get(eliminated_id) == "Hunter":
                hunter_target = room.votes.get(eliminated_id)
                if hunter_target and hunter_target not in eliminated:
                    hunter_bonus.append(hunter_target)

        for extra_id in hunter_bonus:
            if extra_id not in eliminated:
                eliminated.append(extra_id)

        dead_set = set(eliminated)
        werewolves = {
            player_id
            for player_id, final_role in room.current_roles.items()
            if final_role == "Werewolf"
        }
        dead_tanners = [player_id for player_id in dead_set if room.current_roles.get(player_id) == "Tanner"]

        if dead_tanners:
            winner = "Tanner"
        elif not werewolves:
            winner = "Village" if not dead_set else "Werewolf Team"
        elif dead_set & werewolves:
            winner = "Village"
        else:
            winner = "Werewolf Team"

        room.phase = "reveal"
        room.pending_actions.clear()
        room.active_role_started_at = None
        room.active_role_deadline = None
        room.discussion_deadline = None
        self._add_action_history(room, f"Voting resolved. Winner: {winner}.")
        room.result = {
            "winner": winner,
            "eliminated": [room.players[player_id].name for player_id in eliminated],
            "final_roles": {
                room.players[player_id].name: final_role
                for player_id, final_role in room.current_roles.items()
            },
            "votes": {
                room.players[voter_id].name: (
                    room.players[target_id].name if target_id else "No vote"
                )
                for voter_id, target_id in room.votes.items()
            },
            "action_history": list(room.action_history),
        }
        self._add_system_chat(room, f"Voting resolved. Winner: {winner}.")

    def _set_name(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        raw_name = message.get("name")
        if not isinstance(raw_name, str):
            raise GameError("Name must be a string.")
        room.players[player_id].name = self.normalize_name(raw_name)

    def _reset_game(self, room: Room, player_id: str) -> None:
        room.phase = "lobby"
        room.original_roles.clear()
        room.current_roles.clear()
        room.center_cards.clear()
        room.turn_index = 0
        room.night_order.clear()
        room.active_role_started_at = None
        room.active_role_deadline = None
        room.discussion_deadline = None
        room.pending_actions.clear()
        room.action_history.clear()
        room.votes.clear()
        room.chat_log.clear()
        room.result = None

        for player in room.players.values():
            player.original_role = None

        room.notes = {pid: ["Game reset. Waiting in lobby."] for pid in room.players}
        self._add_system_chat(room, f"{room.players[player_id].name} reset the game.")

    def _players_with_original_role(self, room: Room, role: str) -> List[str]:
        return [player_id for player_id, assigned_role in room.original_roles.items() if assigned_role == role]

    def _name_list(self, room: Room, player_ids: List[str]) -> str:
        if not player_ids:
            return "none"
        return ", ".join(room.players[player_id].name for player_id in player_ids)

    def _require_player_target(
        self,
        room: Room,
        message: Dict[str, Any],
        player_id: str,
        key: str,
    ) -> str:
        target_id = message.get(key)
        if not isinstance(target_id, str):
            raise GameError("Missing player target.")
        if target_id == player_id:
            raise GameError("You cannot target yourself.")
        if target_id not in room.players:
            raise GameError("Target player not found.")
        return target_id

    def _require_center_index(self, room: Room, message: Dict[str, Any]) -> int:
        if not room.center_cards:
            raise GameError("No center cards are available.")
        index = message.get("center_index")
        return self._validate_center_index(index, len(room.center_cards))

    def _validate_center_index(self, index: Any, card_count: int) -> int:
        if not isinstance(index, int):
            raise GameError("Center index must be an integer.")
        if index < 0 or index >= card_count:
            raise GameError("Center index out of range.")
        return index

    def _add_chat(self, room: Room, player_id: str, message: Dict[str, Any]) -> None:
        raw_text = message.get("message", "")
        if not isinstance(raw_text, str):
            raise GameError("Chat message must be text.")

        text = raw_text.strip()
        if not text:
            return
        if len(text) > 300:
            raise GameError("Chat message too long.")

        room.chat_log.append({"from": room.players[player_id].name, "message": text})
        room.chat_log = room.chat_log[-120:]

    def _add_system_chat(self, room: Room, message: str) -> None:
        room.chat_log.append({"from": "System", "message": message})
        room.chat_log = room.chat_log[-120:]

    def _add_action_history(self, room: Room, message: str) -> None:
        room.action_history.append(message)
        room.action_history = room.action_history[-200:]

    def _state_for_player(self, room: Room, viewer_id: str) -> Dict[str, Any]:
        viewer = room.players[viewer_id]

        players_payload = []
        for player in room.players.values():
            payload = {
                "id": player.id,
                "name": player.name,
                "connected": player.connected,
                "is_host": player.is_host,
            }
            if room.phase == "reveal":
                payload["original_role"] = room.original_roles.get(player.id)
                payload["final_role"] = room.current_roles.get(player.id)
            players_payload.append(payload)

        role_time_left: Optional[int] = None
        if room.phase == "night" and room.active_role_deadline is not None:
            role_time_left = max(0, int(room.active_role_deadline - time.time() + 0.999))

        discussion_time_left: Optional[int] = None
        if room.phase == "day" and room.discussion_deadline is not None:
            discussion_time_left = max(0, int(room.discussion_deadline - time.time() + 0.999))

        start_blockers = self._start_blockers(room)
        action_payload = self._action_payload_for_player(room, viewer_id)

        return {
            "room": {
                "id": room.id,
                "phase": room.phase,
                "player_count": len(room.players),
                "max_players": room.max_players,
                "turn_role": room.turn_role,
                "call_order": CALL_ORDER,
                "night_order": room.night_order,
                "roles_that_do_not_wake": ROLES_THAT_DO_NOT_WAKE,
                "players": players_payload,
                "chat_log": room.chat_log,
                "votes_submitted": len(room.votes),
                "center_cards": room.center_cards if room.phase == "reveal" else None,
                "action_history": room.action_history if room.phase == "reveal" else None,
                "result": room.result,
                "configured_roles": room.configured_roles,
                "configured_role_total": room.configured_role_total,
                "role_constraints": ROLE_CONSTRAINTS,
                "role_timer_seconds": room.role_timer_seconds,
                "discussion_timer_seconds": room.discussion_timer_seconds,
                "discussion_timer_default_seconds": DEFAULT_DISCUSSION_TIMER_SECONDS,
                "discussion_timer_min_seconds": MIN_DISCUSSION_TIMER_SECONDS,
                "discussion_timer_max_seconds": MAX_DISCUSSION_TIMER_SECONDS,
                "discussion_remaining_seconds": discussion_time_left,
                "discussion_deadline_epoch": room.discussion_deadline,
                "active_role_remaining_seconds": role_time_left,
                "active_role_deadline_epoch": room.active_role_deadline,
            },
            "self": {
                "id": viewer.id,
                "name": viewer.name,
                "is_host": viewer.is_host,
                "original_role": room.original_roles.get(viewer_id),
                "final_role": room.current_roles.get(viewer_id) if room.phase == "reveal" else None,
                "known_info": room.notes.get(viewer_id, []),
                "can_configure": viewer.is_host and room.phase == "lobby",
                "can_start": viewer.is_host and room.phase == "lobby" and not start_blockers,
                "start_blockers": start_blockers,
                "can_reset": room.phase != "night",
                "vote_submitted": viewer_id in room.votes,
                "action": action_payload,
            },
        }

    def _action_payload_for_player(self, room: Room, viewer_id: str) -> Optional[Dict[str, Any]]:
        if room.phase == "night" and viewer_id in room.pending_actions and room.turn_role:
            role = room.turn_role
            selectable_players = [
                {"id": player.id, "name": player.name}
                for player in room.players.values()
                if player.id != viewer_id
            ]
            center_indices = list(range(len(room.center_cards)))

            if role == "Doppelganger":
                return {
                    "kind": "doppelganger",
                    "prompt": "Choose one player to copy.",
                    "players": selectable_players,
                }

            if role == "Werewolf":
                return {
                    "kind": "werewolf_peek",
                    "prompt": "You are the lone werewolf. Peek one center card.",
                    "center_indices": center_indices,
                }

            if role == "Seer":
                return {
                    "kind": "seer",
                    "prompt": (
                        "Choose one player OR two center cards."
                        if len(center_indices) >= 2
                        else "Choose one player to inspect."
                    ),
                    "players": selectable_players,
                    "center_indices": center_indices,
                }

            if role == "Robber":
                return {
                    "kind": "robber",
                    "prompt": "Choose one player to rob.",
                    "players": selectable_players,
                }

            if role == "Troublemaker":
                return {
                    "kind": "troublemaker",
                    "prompt": "Choose two players to swap.",
                    "players": selectable_players,
                }

            if role == "Drunk":
                return {
                    "kind": "drunk",
                    "prompt": "Choose one center card to swap with.",
                    "center_indices": center_indices,
                }

        if room.phase == "day":
            return {
                "kind": "vote",
                "prompt": "Vote for one player to eliminate, or abstain.",
                "players": [
                    {"id": player.id, "name": player.name}
                    for player in room.players.values()
                ],
                "allow_abstain": True,
            }

        return None

    def _public_room_summary(self, room: Room) -> Dict[str, Any]:
        return {
            "id": room.id,
            "phase": room.phase,
            "player_count": len(room.players),
            "max_players": room.max_players,
            "configured_role_total": room.configured_role_total,
            "role_timer_seconds": room.role_timer_seconds,
            "discussion_timer_seconds": room.discussion_timer_seconds,
            "players": [
                {
                    "id": player.id,
                    "name": player.name,
                    "connected": player.connected,
                    "is_host": player.is_host,
                }
                for player in room.players.values()
            ],
        }


hub = WerewolfHub()
