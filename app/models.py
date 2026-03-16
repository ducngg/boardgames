from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set
import time


CALL_ORDER: List[str] = [
    "Doppelganger",
    "Werewolf",
    "Minion",
    "Mason",
    "Seer",
    "Robber",
    "Troublemaker",
    "Drunk",
    "Insomniac",
]

ROLES_THAT_DO_NOT_WAKE: List[str] = ["Villager", "Hunter", "Tanner"]

ALL_ROLES: List[str] = CALL_ORDER + ROLES_THAT_DO_NOT_WAKE

ROLE_CONSTRAINTS: Dict[str, Dict[str, int]] = {
    "Doppelganger": {"min": 0, "max": 1},
    "Werewolf": {"min": 0, "max": 2},
    "Minion": {"min": 0, "max": 1},
    "Mason": {"min": 0, "max": 2},
    "Seer": {"min": 0, "max": 1},
    "Robber": {"min": 0, "max": 1},
    "Troublemaker": {"min": 0, "max": 1},
    "Drunk": {"min": 0, "max": 1},
    "Insomniac": {"min": 0, "max": 1},
    "Villager": {"min": 0, "max": 12},
    "Hunter": {"min": 0, "max": 1},
    "Tanner": {"min": 0, "max": 1},
}

DEFAULT_ROLE_TIMER_SECONDS = 12
MIN_ROLE_TIMER_SECONDS = 3
MAX_ROLE_TIMER_SECONDS = 120


def default_role_config() -> Dict[str, int]:
    return {role: 0 for role in ALL_ROLES}


@dataclass(slots=True)
class Player:
    id: str
    name: str
    is_host: bool = False
    connected: bool = True
    original_role: Optional[str] = None


@dataclass(slots=True)
class Room:
    id: str
    max_players: int = 12
    players: Dict[str, Player] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    phase: str = "lobby"
    original_roles: Dict[str, str] = field(default_factory=dict)
    current_roles: Dict[str, str] = field(default_factory=dict)
    center_cards: List[str] = field(default_factory=list)
    configured_roles: Dict[str, int] = field(default_factory=default_role_config)
    role_timer_seconds: int = DEFAULT_ROLE_TIMER_SECONDS
    night_order: List[str] = field(default_factory=list)
    turn_index: int = 0
    active_role_started_at: Optional[float] = None
    active_role_deadline: Optional[float] = None
    pending_actions: Set[str] = field(default_factory=set)
    notes: Dict[str, List[str]] = field(default_factory=dict)
    action_history: List[str] = field(default_factory=list)
    votes: Dict[str, Optional[str]] = field(default_factory=dict)
    chat_log: List[Dict[str, str]] = field(default_factory=list)
    result: Optional[Dict[str, Any]] = None

    @property
    def turn_role(self) -> Optional[str]:
        if self.phase != "night":
            return None
        if 0 <= self.turn_index < len(self.night_order):
            return self.night_order[self.turn_index]
        return None

    @property
    def configured_role_total(self) -> int:
        return sum(self.configured_roles.values())

    def player_ids(self) -> List[str]:
        return list(self.players.keys())