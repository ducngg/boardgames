const state = {
  socket: null,
  roomId: "",
  playerName: "",
  playerId: "",
  current: null,
};

const joinSection = document.getElementById("join-section");
const gameSection = document.getElementById("game-section");
const roomInput = document.getElementById("room-id");
const nameInput = document.getElementById("player-name");
const joinButton = document.getElementById("join-btn");
const saveConfigButton = document.getElementById("save-config-btn");
const startButton = document.getElementById("start-btn");
const resetButton = document.getElementById("reset-btn");
const statusTitle = document.getElementById("status-title");
const statusLine = document.getElementById("status-line");
const startBlockers = document.getElementById("start-blockers");
const configPanel = document.getElementById("config-panel");
const configGrid = document.getElementById("config-grid");
const timerInput = document.getElementById("timer-seconds");
const configSummary = document.getElementById("config-summary");
const configReadonly = document.getElementById("config-readonly");
const configReadonlyList = document.getElementById("config-readonly-list");
const configReadonlySummary = document.getElementById("config-readonly-summary");
const playersList = document.getElementById("players-list");
const selfName = document.getElementById("self-name");
const selfRole = document.getElementById("self-role");
const notesList = document.getElementById("notes-list");
const actionBox = document.getElementById("action-box");
const chatLog = document.getElementById("chat-log");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");
const resultBox = document.getElementById("result-box");
const errorBox = document.getElementById("error-box");

roomInput.value = "friends-room";

function idStorageKey(roomId, playerName) {
  return `werewolf:${roomId}:${playerName}`;
}

function clearError() {
  errorBox.textContent = "";
}

function setError(message) {
  errorBox.textContent = message;
}

function sendMessage(payload) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    setError("Socket is not connected.");
    return;
  }
  state.socket.send(JSON.stringify(payload));
}

function connect() {
  clearError();

  const roomId = roomInput.value.trim();
  const playerName = nameInput.value.trim();
  if (!roomId) {
    setError("Room ID is required.");
    return;
  }
  if (!playerName) {
    setError("Name is required.");
    return;
  }

  state.roomId = roomId;
  state.playerName = playerName;
  state.current = null;

  const savedId = localStorage.getItem(idStorageKey(roomId, playerName));
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  let url = `${protocol}://${location.host}/ws/${encodeURIComponent(roomId)}?name=${encodeURIComponent(playerName)}`;
  if (savedId) {
    url += `&player_id=${encodeURIComponent(savedId)}`;
  }

  if (state.socket) {
    state.socket.close();
  }

  const socket = new WebSocket(url);
  state.socket = socket;

  socket.onopen = () => {
    joinSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
  };

  socket.onclose = () => {
    setError("Disconnected from server.");
    gameSection.classList.add("hidden");
    joinSection.classList.remove("hidden");
  };

  socket.onerror = () => {
    setError("WebSocket error.");
  };

  socket.onmessage = (event) => {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (_error) {
      setError("Invalid JSON from server.");
      return;
    }

    if (payload.type === "error") {
      setError(payload.message || "Server error.");
      if (!state.current) {
        gameSection.classList.add("hidden");
        joinSection.classList.remove("hidden");
      }
      return;
    }

    if (payload.type === "welcome") {
      state.playerId = payload.player_id;
      localStorage.setItem(idStorageKey(state.roomId, state.playerName), payload.player_id);
      clearError();
      return;
    }

    if (payload.type === "state") {
      state.current = payload.state;
      clearError();
      renderState();
    }
  };
}

function getRemainingSeconds(room) {
  if (!room || !room.active_role_deadline_epoch) {
    return null;
  }
  const delta = room.active_role_deadline_epoch - Date.now() / 1000;
  return Math.max(0, Math.ceil(delta));
}

function renderState() {
  if (!state.current) {
    return;
  }

  const room = state.current.room;
  const self = state.current.self;

  statusTitle.textContent = `Room: ${room.id}`;
  renderStatusLine(room);
  renderStartBlockers(room, self);

  saveConfigButton.classList.toggle("hidden", !self.can_configure);
  startButton.classList.toggle("hidden", !self.is_host);
  startButton.disabled = !self.can_start;
  resetButton.classList.toggle("hidden", !self.can_reset);

  renderRoleConfig(room, self);
  renderPlayers(room);
  renderSelfState(self);
  renderAction(self.action, self.vote_submitted);
  renderChat(room.chat_log || []);
  renderResult(room.result, room.center_cards, room.action_history);
}

function renderStatusLine(room) {
  const parts = [`Phase: ${room.phase}`];
  if (room.turn_role) {
    parts.push(`Wake: ${room.turn_role}`);
  }
  const seconds = getRemainingSeconds(room);
  if (seconds !== null && room.phase === "night") {
    parts.push(`Timer: ${seconds}s`);
  }
  statusLine.textContent = parts.join(" • ");
}

function renderStartBlockers(room, self) {
  if (!self.is_host || room.phase !== "lobby") {
    startBlockers.textContent = "";
    return;
  }

  if (!self.start_blockers || self.start_blockers.length === 0) {
    startBlockers.textContent = "Ready to start.";
    return;
  }

  startBlockers.textContent = `Cannot start: ${self.start_blockers.join(" | ")}`;
}

function renderRoleConfig(room, self) {
  const showHostEditor = self.can_configure;
  configPanel.classList.toggle("hidden", !showHostEditor);
  configReadonly.classList.toggle("hidden", showHostEditor);

  configGrid.innerHTML = "";

  const constraints = room.role_constraints || {};
  const configuredRoles = room.configured_roles || {};
  const roleNames = Object.keys(constraints);

  for (const role of roleNames) {
    const limits = constraints[role];

    const label = document.createElement("div");
    label.className = "config-label";
    label.textContent = `${role} (${limits.min}-${limits.max})`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = String(limits.min);
    input.max = String(limits.max);
    input.step = "1";
    input.dataset.role = role;
    input.className = "count-input";
    input.value = String(configuredRoles[role] ?? 0);

    const decreaseButton = createButton("-", () => {
      adjustRoleCount(input, -1, limits.min, limits.max);
    });
    decreaseButton.classList.add("tiny-btn");

    const increaseButton = createButton("+", () => {
      adjustRoleCount(input, 1, limits.min, limits.max);
    });
    increaseButton.classList.add("tiny-btn");

    const controls = document.createElement("div");
    controls.className = "config-controls";
    controls.appendChild(decreaseButton);
    controls.appendChild(input);
    controls.appendChild(increaseButton);

    configGrid.appendChild(label);
    configGrid.appendChild(controls);
  }

  timerInput.value = String(room.role_timer_seconds ?? 12);

  const summary = `Configured roles: ${room.configured_role_total} • Required: ${room.player_count + 3}`;
  configSummary.textContent = summary;
  configReadonlySummary.textContent = summary;

  configReadonlyList.innerHTML = "";
  const configuredEntries = Object.entries(configuredRoles)
    .filter(([, count]) => Number(count) > 0)
    .sort((left, right) => left[0].localeCompare(right[0]));

  if (configuredEntries.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No roles configured.";
    configReadonlyList.appendChild(item);
  } else {
    for (const [role, count] of configuredEntries) {
      const item = document.createElement("li");
      item.textContent = `${role}: ${count}`;
      configReadonlyList.appendChild(item);
    }
  }
}

function renderPlayers(room) {
  playersList.innerHTML = "";
  for (const player of room.players) {
    const item = document.createElement("li");
    const tags = [];

    if (player.is_host) {
      tags.push("host");
    }
    if (!player.connected) {
      tags.push("offline");
    }

    let text = player.name;
    if (tags.length) {
      text += ` (${tags.join(", ")})`;
    }

    if (room.phase === "reveal" && player.final_role) {
      text += ` • final: ${player.final_role}`;
    }

    item.textContent = text;
    playersList.appendChild(item);
  }
}

function renderSelfState(self) {
  selfName.textContent = `You: ${self.name}${self.is_host ? " (host)" : ""}`;
  selfName.classList.add("self-name");

  selfRole.textContent = self.original_role
    ? `Original role: ${self.original_role}${self.final_role ? ` • Final role: ${self.final_role}` : ""}`
    : "No role assigned yet.";

  notesList.innerHTML = "";
  for (const note of self.known_info || []) {
    const item = document.createElement("li");
    item.textContent = note;
    notesList.appendChild(item);
  }
}

function renderAction(action, voteSubmitted) {
  actionBox.innerHTML = "";

  if (!action) {
    const text = document.createElement("p");
    text.textContent = "No action required right now.";
    actionBox.appendChild(text);
    return;
  }

  if (action.kind === "vote" && voteSubmitted) {
    const text = document.createElement("p");
    text.textContent = "Vote submitted. Waiting for others.";
    actionBox.appendChild(text);
    return;
  }

  const prompt = document.createElement("p");
  prompt.textContent = action.prompt;
  actionBox.appendChild(prompt);

  if (action.kind === "doppelganger" || action.kind === "robber") {
    const select = createPlayerSelect(action.players);
    const button = createButton("Submit", () => {
      sendMessage({ type: "night_action", target_player_id: select.value });
    });
    actionBox.appendChild(select);
    actionBox.appendChild(button);
    return;
  }

  if (action.kind === "werewolf_peek" || action.kind === "drunk") {
    if (!Array.isArray(action.center_indices) || action.center_indices.length === 0) {
      const text = document.createElement("p");
      text.textContent = "No center cards available for this action.";
      actionBox.appendChild(text);
      return;
    }

    const select = createCenterSelect(action.center_indices);
    const button = createButton("Submit", () => {
      sendMessage({ type: "night_action", center_index: Number(select.value) });
    });
    actionBox.appendChild(select);
    actionBox.appendChild(button);
    return;
  }

  if (action.kind === "seer") {
    const hasCenterChoice = Array.isArray(action.center_indices) && action.center_indices.length >= 2;
    const playerSelect = createPlayerSelect(action.players);

    if (!hasCenterChoice) {
      const button = createButton("Submit", () => {
        sendMessage({ type: "night_action", target_player_id: playerSelect.value });
      });
      actionBox.appendChild(playerSelect);
      actionBox.appendChild(button);
      return;
    }

    const modeRow = document.createElement("div");
    modeRow.className = "row";

    const playerRadio = document.createElement("input");
    playerRadio.type = "radio";
    playerRadio.name = "seer-mode";
    playerRadio.value = "player";
    playerRadio.checked = true;

    const centerRadio = document.createElement("input");
    centerRadio.type = "radio";
    centerRadio.name = "seer-mode";
    centerRadio.value = "center";

    const playerLabel = document.createElement("label");
    playerLabel.textContent = "Inspect player";
    playerLabel.prepend(playerRadio);

    const centerLabel = document.createElement("label");
    centerLabel.textContent = "Inspect center cards";
    centerLabel.prepend(centerRadio);

    modeRow.appendChild(playerLabel);
    modeRow.appendChild(centerLabel);
    actionBox.appendChild(modeRow);

    const centerOne = createCenterSelect(action.center_indices);
    const centerTwo = createCenterSelect(action.center_indices);

    const centerRow = document.createElement("div");
    centerRow.className = "row hidden";
    centerRow.appendChild(centerOne);
    centerRow.appendChild(centerTwo);

    function updateSeerInputs() {
      if (playerRadio.checked) {
        playerSelect.classList.remove("hidden");
        centerRow.classList.add("hidden");
      } else {
        playerSelect.classList.add("hidden");
        centerRow.classList.remove("hidden");
      }
    }

    playerRadio.addEventListener("change", updateSeerInputs);
    centerRadio.addEventListener("change", updateSeerInputs);

    const button = createButton("Submit", () => {
      if (playerRadio.checked) {
        sendMessage({ type: "night_action", target_player_id: playerSelect.value });
      } else {
        sendMessage({
          type: "night_action",
          center_indices: [Number(centerOne.value), Number(centerTwo.value)],
        });
      }
    });

    actionBox.appendChild(playerSelect);
    actionBox.appendChild(centerRow);
    actionBox.appendChild(button);
    return;
  }

  if (action.kind === "troublemaker") {
    const selectA = createPlayerSelect(action.players);
    const selectB = createPlayerSelect(action.players);
    const row = document.createElement("div");
    row.className = "row";
    row.appendChild(selectA);
    row.appendChild(selectB);

    const button = createButton("Submit", () => {
      sendMessage({
        type: "night_action",
        target_a: selectA.value,
        target_b: selectB.value,
      });
    });

    actionBox.appendChild(row);
    actionBox.appendChild(button);
    return;
  }

  if (action.kind === "vote") {
    const select = document.createElement("select");

    const abstain = document.createElement("option");
    abstain.value = "";
    abstain.textContent = "No vote";
    select.appendChild(abstain);

    for (const player of action.players) {
      const option = document.createElement("option");
      option.value = player.id;
      option.textContent = player.name;
      select.appendChild(option);
    }

    const button = createButton("Submit Vote", () => {
      sendMessage({ type: "vote", target_player_id: select.value || null });
    });

    actionBox.appendChild(select);
    actionBox.appendChild(button);
  }
}

function createPlayerSelect(players) {
  const select = document.createElement("select");
  if (!Array.isArray(players) || players.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No players available";
    select.appendChild(option);
    select.disabled = true;
    return select;
  }

  for (const player of players) {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = player.name;
    select.appendChild(option);
  }
  return select;
}

function createCenterSelect(indices) {
  const select = document.createElement("select");
  if (!Array.isArray(indices) || indices.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No center cards";
    select.appendChild(option);
    select.disabled = true;
    return select;
  }

  for (const index of indices) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `Center #${index + 1}`;
    select.appendChild(option);
  }
  return select;
}

function createButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function adjustRoleCount(input, delta, min, max) {
  const currentValue = Number(input.value || 0);
  const next = Math.max(min, Math.min(max, currentValue + delta));
  input.value = String(next);
}

function renderChat(chatItems) {
  chatLog.innerHTML = "";
  for (const entry of chatItems) {
    const item = document.createElement("div");
    item.className = "chat-item";
    item.textContent = `${entry.from}: ${entry.message}`;
    chatLog.appendChild(item);
  }
  chatLog.scrollTop = chatLog.scrollHeight;
}

function renderResult(result, centerCards, actionHistory) {
  if (!result) {
    resultBox.textContent = "No result yet.";
    return;
  }

  const lines = [];
  lines.push(`Winner: ${result.winner}`);
  lines.push("");
  lines.push("Eliminated:");

  if (result.eliminated.length === 0) {
    lines.push("- Nobody");
  } else {
    for (const player of result.eliminated) {
      lines.push(`- ${player}`);
    }
  }

  lines.push("");
  lines.push("Final Roles:");
  for (const [player, role] of Object.entries(result.final_roles)) {
    lines.push(`- ${player}: ${role}`);
  }

  lines.push("");
  lines.push("Votes:");
  for (const [voter, vote] of Object.entries(result.votes)) {
    lines.push(`- ${voter} -> ${vote}`);
  }

  if (Array.isArray(centerCards) && centerCards.length > 0) {
    lines.push("");
    lines.push("Center Cards:");
    centerCards.forEach((role, index) => {
      lines.push(`- #${index + 1}: ${role}`);
    });
  }

  const history = Array.isArray(actionHistory)
    ? actionHistory
    : Array.isArray(result.action_history)
      ? result.action_history
      : [];
  if (history.length > 0) {
    lines.push("");
    lines.push("Action History:");
    history.forEach((entry) => {
      lines.push(`- ${entry}`);
    });
  }

  resultBox.textContent = lines.join("\n");
}

joinButton.addEventListener("click", connect);

saveConfigButton.addEventListener("click", () => {
  const roleInputs = configGrid.querySelectorAll("input[data-role]");
  const roles = {};

  for (const input of roleInputs) {
    const role = input.dataset.role;
    roles[role] = Number(input.value || 0);
  }

  sendMessage({
    type: "configure_roles",
    roles,
    timer_seconds: Number(timerInput.value || 0),
  });
});

startButton.addEventListener("click", () => {
  sendMessage({ type: "start_game" });
});

resetButton.addEventListener("click", () => {
  sendMessage({ type: "reset_game" });
});

chatSend.addEventListener("click", () => {
  const message = chatInput.value.trim();
  if (!message) {
    return;
  }
  sendMessage({ type: "chat", message });
  chatInput.value = "";
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    chatSend.click();
  }
});

setInterval(() => {
  if (state.current) {
    renderStatusLine(state.current.room);
  }
}, 500);
