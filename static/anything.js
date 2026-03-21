const joinSection = document.getElementById("join-section");
const gameSection = document.getElementById("game-section");
const roomIdInput = document.getElementById("room-id");
const playerNameInput = document.getElementById("player-name");
const joinBtn = document.getElementById("join-btn");
const roomLine = document.getElementById("room-line");
const hostControls = document.getElementById("host-controls");
const promptInput = document.getElementById("prompt-input");
const sendBtn = document.getElementById("send-btn");
const revealBtn = document.getElementById("reveal-btn");
const resetBtn = document.getElementById("reset-btn");
const playersList = document.getElementById("players-list");
const selfItem = document.getElementById("self-item");
const revealedSection = document.getElementById("revealed-section");
const revealedList = document.getElementById("revealed-list");
const errorBox = document.getElementById("error-box");

const appState = {
  socket: null,
  roomId: null,
  playerId: null,
};

function normalizeRoomId(roomId) {
  const cleaned = roomId.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
  return cleaned.slice(0, 24) || "anything-room";
}

function normalizeName(name) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return (trimmed || "Player").slice(0, 24);
}

function playerStorageKey(roomId, name) {
  return `anything-player:${normalizeRoomId(roomId)}:${normalizeName(name).toLowerCase()}`;
}

function wsUrl(roomId, name, playerId) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const params = new URLSearchParams({ name });
  if (playerId) {
    params.set("player_id", playerId);
  }
  return `${protocol}://${window.location.host}/ws/anything/${encodeURIComponent(roomId)}?${params.toString()}`;
}

function showError(message) {
  errorBox.textContent = message || "";
}

function sendMessage(payload) {
  if (!appState.socket || appState.socket.readyState !== WebSocket.OPEN) {
    showError("Not connected.");
    return;
  }
  appState.socket.send(JSON.stringify(payload));
}

function renderPlayers(players) {
  playersList.innerHTML = "";
  for (const player of players) {
    const li = document.createElement("li");
    const hostTag = player.is_host ? " (host)" : "";
    const onlineTag = player.connected ? "" : " (offline)";
    li.textContent = `${player.name}${hostTag}${onlineTag}`;
    playersList.appendChild(li);
  }
}

function renderRevealedItems(room) {
  const isRevealed = Boolean(room.revealed);
  const revealedItems = Array.isArray(room.revealed_items) ? room.revealed_items : [];

  revealedSection.classList.toggle("hidden", !isRevealed);
  revealedList.innerHTML = "";

  if (!isRevealed) {
    return;
  }

  if (revealedItems.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No revealed items.";
    revealedList.appendChild(li);
    return;
  }

  for (const entry of revealedItems) {
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.item}`;
    revealedList.appendChild(li);
  }
}

function renderState(state) {
  const room = state.room || {};
  const self = state.self || {};
  const assignedCount = Number(room.items_assigned_count || 0);
  roomLine.textContent = `Room ${room.id} • Players ${room.player_count}/${room.max_players} • Assigned ${assignedCount}`;

  renderPlayers(Array.isArray(room.players) ? room.players : []);
  renderRevealedItems(room);

  if (self.assigned_item) {
    selfItem.textContent = `Your item: ${self.assigned_item}`;
  } else {
    selfItem.textContent = "No item assigned yet.";
  }

  const isHost = Boolean(self.is_host);
  hostControls.classList.toggle("hidden", !isHost);
  sendBtn.disabled = !Boolean(self.can_send);
  revealBtn.disabled = !Boolean(self.can_reveal);

  if (document.activeElement !== promptInput) {
    promptInput.value = room.prompt || "";
  }
}

function connect(roomId, name) {
  const knownPlayerId = localStorage.getItem(playerStorageKey(roomId, name));
  const socket = new WebSocket(wsUrl(roomId, name, knownPlayerId));
  appState.socket = socket;

  socket.onopen = () => {
    showError("");
    joinBtn.disabled = true;
  };

  socket.onmessage = (event) => {
    let payload = null;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }

    if (payload.type === "welcome") {
      appState.roomId = payload.room_id;
      appState.playerId = payload.player_id;
      localStorage.setItem(playerStorageKey(payload.room_id, name), payload.player_id);
      joinSection.classList.add("hidden");
      gameSection.classList.remove("hidden");
      return;
    }

    if (payload.type === "state") {
      renderState(payload.state || {});
      return;
    }

    if (payload.type === "error") {
      showError(payload.message || "Unexpected server error.");
    }
  };

  socket.onclose = () => {
    joinBtn.disabled = false;
    if (appState.roomId) {
      showError("Disconnected. Rejoin if needed.");
    }
  };

  socket.onerror = () => {
    showError("WebSocket connection failed.");
  };
}

joinBtn.addEventListener("click", () => {
  const roomId = normalizeRoomId(roomIdInput.value || "");
  const name = (playerNameInput.value || "").trim();

  if (!name) {
    showError("Please enter a name.");
    return;
  }

  connect(roomId, name);
});

sendBtn.addEventListener("click", () => {
  const prompt = (promptInput.value || "").trim();
  if (!prompt) {
    showError("Prompt is empty.");
    return;
  }
  showError("");
  sendMessage({ type: "send", prompt });
});

resetBtn.addEventListener("click", () => {
  showError("");
  sendMessage({ type: "reset" });
});

revealBtn.addEventListener("click", () => {
  showError("");
  sendMessage({ type: "reveal" });
});