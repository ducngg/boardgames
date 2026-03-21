# One Night Werewolf (FastAPI)

Simple MVP for a 2-way real-time One Night Werewolf room with up to 12 players.

## Features

- FastAPI backend with websocket room sync
- Simple Python `Player` / `Room` objects for game state
- Host can configure role counts before start (min/max constraints per role)
- Game starts only when total configured roles equals number of joined players + 3
- Host is a normal player during gameplay (special actions: configure + start)
- Configurable timer (N seconds) per called night role
- Reveal includes full action history from the night
- Language switch in UI (English / Vietnamese)
- Night wake order implemented:
  - Doppelganger
  - Werewolves
  - Minion
  - Masons
  - Seer
  - Robber
  - Troublemaker
  - Drunk
  - Insomniac
- Roles that do not wake:
  - Villager
  - Hunter
  - Tanner
- Day voting and reveal results
- Plain HTML/CSS/JS frontend (compact + mobile friendly)

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open: `http://127.0.0.1:8000`

## Config

Create/update `config.yaml` in project root:

```yaml
openai_api_key: "YOUR_OPENAI_API_KEY"
openai_model: "gpt-4o-mini"
```

`openai_api_key` is required for the `/anything` game mode.

## Guess My Anything

- Open: `http://127.0.0.1:8000/anything`
- WebSocket: `WS /ws/anything/{room_id}?name=YOUR_NAME[&player_id=EXISTING_ID]`
- Host actions only:
  - `send` (includes prompt text, calls OpenAI, privately assigns `N` unique items to `N` players)
  - `reveal` (reveal all player-item pairs to everyone in the room)
  - `reset` (clear prompt + private assignments)

## API/WebSocket

- `GET /api/health`
- `GET /api/call-order`
- `GET /api/rooms`
- `GET /api/rooms/{room_id}`
- `WS /ws/{room_id}?name=YOUR_NAME[&player_id=EXISTING_ID]`
- `GET /anything`
- `WS /ws/anything/{room_id}?name=YOUR_NAME[&player_id=EXISTING_ID]`

Client websocket message types:

- `configure_roles`
- `start_game`
- `night_action`
- `vote`
- `chat`
- `reset_game`
- `set_name`

Server websocket message types:

- `welcome`
- `state`
- `error`

## Notes

- Room join is locked once a game starts; host can reset to lobby.
- Maximum 12 players enforced.
- Doppelganger action is simplified: copy only, no chained wake action.
- Exactly 3 center cards are always used (`N+3` total roles for `N` players).