from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .game import GameError, hub
from .models import (
    CALL_ORDER,
    DEFAULT_ROLE_TIMER_SECONDS,
    MAX_ROLE_TIMER_SECONDS,
    MIN_ROLE_TIMER_SECONDS,
    ROLE_CONSTRAINTS,
    ROLES_THAT_DO_NOT_WAKE,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    async def timer_worker() -> None:
        while True:
            room_ids = await hub.tick_role_timers()
            for room_id in room_ids:
                await hub.broadcast_room_state(room_id)
            await asyncio.sleep(0.5)

    timer_task = asyncio.create_task(timer_worker())
    try:
        yield
    finally:
        timer_task.cancel()
        with suppress(asyncio.CancelledError):
            await timer_task


app = FastAPI(title="One Night Werewolf", version="0.2.0", lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def index() -> FileResponse:
    return FileResponse("static/index.html")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/call-order")
async def call_order() -> dict[str, Any]:
    return {
        "call_order": CALL_ORDER,
        "roles_that_do_not_wake": ROLES_THAT_DO_NOT_WAKE,
        "role_constraints": ROLE_CONSTRAINTS,
        "default_role_timer_seconds": DEFAULT_ROLE_TIMER_SECONDS,
        "min_role_timer_seconds": MIN_ROLE_TIMER_SECONDS,
        "max_role_timer_seconds": MAX_ROLE_TIMER_SECONDS,
    }


@app.get("/api/rooms")
async def list_rooms() -> dict[str, list[dict]]:
    return {"rooms": await hub.list_rooms()}


@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str) -> dict:
    normalized_room_id = hub.normalize_room_id(room_id)
    room = await hub.get_room_summary(normalized_room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@app.websocket("/ws/{room_id}")
async def websocket_room(
    websocket: WebSocket,
    room_id: str,
    name: str = Query(min_length=1, max_length=24),
    player_id: Optional[str] = Query(default=None, min_length=8, max_length=24),
) -> None:
    await websocket.accept()

    normalized_room_id = hub.normalize_room_id(room_id)
    normalized_name = hub.normalize_name(name)
    active_player_id: Optional[str] = None

    try:
        _, player = await hub.connect(
            room_id=normalized_room_id,
            player_name=normalized_name,
            player_id=player_id,
            websocket=websocket,
        )
        active_player_id = player.id

        await websocket.send_json(
            {
                "type": "welcome",
                "room_id": normalized_room_id,
                "player_id": player.id,
                "name": player.name,
            }
        )
        await hub.broadcast_room_state(normalized_room_id)

        while True:
            incoming = await websocket.receive_json()
            try:
                await hub.process_message(normalized_room_id, player.id, incoming)
            except GameError as exc:
                await websocket.send_json({"type": "error", "message": str(exc)})
            else:
                await hub.broadcast_room_state(normalized_room_id)

    except GameError as exc:
        await websocket.send_json({"type": "error", "message": str(exc)})
    except WebSocketDisconnect:
        pass
    finally:
        if active_player_id:
            await hub.disconnect(normalized_room_id, active_player_id)
            await hub.broadcast_room_state(normalized_room_id)
