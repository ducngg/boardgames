from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
import json
import secrets
from typing import Any, Dict, List, Optional, Tuple

from fastapi import WebSocket
from openai import AsyncOpenAI


class AnythingError(Exception):
    pass


@dataclass(slots=True)
class AnythingPlayer:
    id: str
    name: str
    is_host: bool = False
    connected: bool = True


@dataclass(slots=True)
class AnythingRoom:
    id: str
    max_players: int = 12
    players: Dict[str, AnythingPlayer] = field(default_factory=dict)
    prompt: str = ""
    player_items: Dict[str, str] = field(default_factory=dict)
    revealed: bool = False


class AnythingHub:
    def __init__(self) -> None:
        self.rooms: Dict[str, AnythingRoom] = {}
        self.connections: Dict[str, Dict[str, WebSocket]] = {}
        self._lock = asyncio.Lock()
        self._openai_client: Optional[AsyncOpenAI] = None
        self._openai_model: str = "gpt-4o-mini"

    def configure_openai(self, api_key: str, model: str) -> None:
        cleaned_key = api_key.strip()
        self._openai_model = model.strip() or "gpt-4o-mini"
        self._openai_client = AsyncOpenAI(api_key=cleaned_key) if cleaned_key else None

    def normalize_room_id(self, room_id: str) -> str:
        cleaned = "".join(ch for ch in room_id.lower().strip() if ch.isalnum() or ch in {"-", "_"})
        return cleaned[:24] or "anything-room"

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
    ) -> Tuple[AnythingRoom, AnythingPlayer]:
        async with self._lock:
            room = self.rooms.setdefault(room_id, AnythingRoom(id=room_id))
            player: Optional[AnythingPlayer] = None

            if player_id and player_id in room.players:
                player = room.players[player_id]
                player.connected = True
                player.name = player_name
            else:
                if len(room.players) >= room.max_players:
                    raise AnythingError("Room is full. Maximum is 12 players.")

                created_player_id = self._new_player_id()
                player = AnythingPlayer(
                    id=created_player_id,
                    name=player_name,
                    is_host=len(room.players) == 0,
                    connected=True,
                )
                room.players[player.id] = player

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
                self._ensure_host_exists(room)

    async def list_rooms(self) -> List[Dict[str, Any]]:
        async with self._lock:
            return [self._public_room_summary(room) for room in self.rooms.values()]

    async def process_message(self, room_id: str, player_id: str, message: Dict[str, Any]) -> None:
        if not isinstance(message, dict):
            raise AnythingError("Invalid websocket payload.")

        message_type = message.get("type")
        if message_type == "send":
            await self._send_prompt(room_id, player_id, message)
            return

        async with self._lock:
            room = self.rooms.get(room_id)
            if room is None:
                raise AnythingError("Room not found.")
            if player_id not in room.players:
                raise AnythingError("Player does not belong to this room.")
            self._ensure_host_exists(room)

            if message_type == "reset":
                self._reset(room, player_id)
            elif message_type == "reveal":
                self._reveal(room, player_id)
            elif message_type == "set_name":
                self._set_name(room, player_id, message)
            elif message_type == "ping":
                return
            else:
                raise AnythingError("Unknown message type.")

    async def broadcast_room_state(self, room_id: str) -> None:
        async with self._lock:
            room = self.rooms.get(room_id)
            if room is None:
                return
            self._ensure_host_exists(room)

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
                if room:
                    self._ensure_host_exists(room)

    async def _send_prompt(self, room_id: str, player_id: str, message: Dict[str, Any]) -> None:
        async with self._lock:
            room = self.rooms.get(room_id)
            if room is None:
                raise AnythingError("Room not found.")
            if player_id not in room.players:
                raise AnythingError("Player does not belong to this room.")
            self._ensure_host_exists(room)
            self._require_host(room, player_id)

            raw_prompt = message.get("prompt")
            if not isinstance(raw_prompt, str):
                raise AnythingError("Prompt must be text.")

            prompt = raw_prompt.strip()
            if not prompt:
                raise AnythingError("Prompt is empty. Set a prompt first.")
            if len(prompt) > 300:
                raise AnythingError("Prompt is too long.")

            item_count = len(room.players)
            if item_count <= 0:
                raise AnythingError("Need at least one player in the room.")

            room_player_ids = list(room.players.keys())

            client = self._openai_client
            model = self._openai_model

        if client is None:
            raise AnythingError("OpenAI is not configured. Add openai_api_key to config.yaml.")

        items = await self._generate_items(client, model, prompt, item_count)
        assigned_items = self._assign_items_to_players(room_player_ids=room_player_ids, items=items)

        async with self._lock:
            room = self.rooms.get(room_id)
            if room is None:
                return
            if player_id not in room.players:
                return
            current_player_ids = set(room.players.keys())
            room.prompt = prompt
            room.revealed = False
            room.player_items = {
                assigned_player_id: item
                for assigned_player_id, item in assigned_items.items()
                if assigned_player_id in current_player_ids
            }

    async def _generate_items(
        self,
        client: AsyncOpenAI,
        model: str,
        prompt: str,
        item_count: int,
    ) -> List[str]:
        system_prompt = (
            "You create guessable answers for a party game. "
            "Return strict JSON object with key 'items'. "
            "'items' must be an array of short strings. "
            "No markdown, no code fences, no extra keys."
        )
        user_prompt = (
            f"Host request: {prompt}\n"
            f"Generate exactly {item_count} items. Keep each item concise. Be creative!"
        )

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                response_format={"type": "json_object"},
            )
        except Exception as exc:
            raise AnythingError(f"OpenAI request failed: {exc}") from exc

        if not response.choices:
            raise AnythingError("OpenAI returned no choices.")

        content = response.choices[0].message.content
        if not content:
            raise AnythingError("OpenAI returned empty content.")

        return self._parse_generated_items(content, item_count)

    def _parse_generated_items(self, content: str, expected_count: int) -> List[str]:
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as exc:
            raise AnythingError("OpenAI returned invalid JSON.") from exc

        items: Any
        if isinstance(parsed, dict):
            items = parsed.get("items")
        else:
            items = parsed

        if not isinstance(items, list):
            raise AnythingError("OpenAI response must contain an 'items' array.")

        cleaned_items = [item.strip() for item in items if isinstance(item, str) and item.strip()]

        unique_items: List[str] = []
        seen: set[str] = set()
        for item in cleaned_items:
            key = item.casefold()
            if key in seen:
                continue
            seen.add(key)
            unique_items.append(item)

        if len(unique_items) < expected_count:
            raise AnythingError(
                f"OpenAI returned too few unique items ({len(unique_items)}). Expected {expected_count}."
            )

        return unique_items[:expected_count]

    def _assign_items_to_players(self, room_player_ids: List[str], items: List[str]) -> Dict[str, str]:
        if len(items) < len(room_player_ids):
            raise AnythingError("Not enough generated items to assign one per player.")
        return {
            player_id: items[index]
            for index, player_id in enumerate(room_player_ids)
        }

    def _reveal(self, room: AnythingRoom, player_id: str) -> None:
        self._require_host(room, player_id)
        if not room.player_items:
            raise AnythingError("Nothing to reveal. Send items first.")
        room.revealed = True

    def _reset(self, room: AnythingRoom, player_id: str) -> None:
        self._require_host(room, player_id)
        room.prompt = ""
        room.player_items = {}
        room.revealed = False

    def _set_name(self, room: AnythingRoom, player_id: str, message: Dict[str, Any]) -> None:
        raw_name = message.get("name")
        if not isinstance(raw_name, str):
            raise AnythingError("Name must be text.")
        room.players[player_id].name = self.normalize_name(raw_name)

    def _ensure_host_exists(self, room: AnythingRoom) -> None:
        chosen_host_id: Optional[str] = None

        connected_hosts = [
            player_id
            for player_id, player in room.players.items()
            if player.connected and player.is_host
        ]
        if connected_hosts:
            chosen_host_id = connected_hosts[0]
        else:
            connected_players = [
                player_id
                for player_id, player in room.players.items()
                if player.connected
            ]
            if connected_players:
                chosen_host_id = connected_players[0]
            elif room.players:
                chosen_host_id = next(iter(room.players))

        for player in room.players.values():
            player.is_host = False

        if chosen_host_id is not None:
            room.players[chosen_host_id].is_host = True

    def _require_host(self, room: AnythingRoom, player_id: str) -> None:
        player = room.players[player_id]
        if not player.is_host:
            raise AnythingError("Only the host can do that.")

    def _revealed_items_payload(self, room: AnythingRoom) -> List[Dict[str, str]]:
        if not room.revealed:
            return []

        revealed_items: List[Dict[str, str]] = []
        for player_id, player in room.players.items():
            item = room.player_items.get(player_id)
            if item is None:
                continue
            revealed_items.append(
                {
                    "player_id": player_id,
                    "name": player.name,
                    "item": item,
                }
            )
        return revealed_items

    def _state_for_player(self, room: AnythingRoom, viewer_id: str) -> Dict[str, Any]:
        viewer = room.players[viewer_id]
        return {
            "room": {
                "id": room.id,
                "player_count": len(room.players),
                "max_players": room.max_players,
                "prompt": room.prompt,
                "items_assigned_count": len(room.player_items),
                "revealed": room.revealed,
                "revealed_items": self._revealed_items_payload(room),
                "players": [
                    {
                        "id": player.id,
                        "name": player.name,
                        "is_host": player.is_host,
                        "connected": player.connected,
                    }
                    for player in room.players.values()
                ],
            },
            "self": {
                "id": viewer.id,
                "name": viewer.name,
                "is_host": viewer.is_host,
                "can_send": viewer.is_host,
                "can_reset": viewer.is_host,
                "can_reveal": viewer.is_host and bool(room.player_items) and not room.revealed,
                "assigned_item": room.player_items.get(viewer_id),
            },
        }

    def _public_room_summary(self, room: AnythingRoom) -> Dict[str, Any]:
        return {
            "id": room.id,
            "player_count": len(room.players),
            "max_players": room.max_players,
            "prompt_set": bool(room.prompt),
            "generated_count": len(room.player_items),
            "revealed": room.revealed,
            "players": [
                {
                    "id": player.id,
                    "name": player.name,
                    "is_host": player.is_host,
                    "connected": player.connected,
                }
                for player in room.players.values()
            ],
        }


anything_hub = AnythingHub()