import { gameState, myTeamId } from "../state/gameState.js";
import { MAX_ARCANA } from "../../shared/constants.js";
import { initSocket } from "../net/socket.js";
// [NEW] Import logic Hand
import { updateHand } from "./hand.js";

const elFill = document.getElementById("elixir-fill");
const elText = document.getElementById("elixir-text");
const elHand = document.getElementById("hand-cards"); // Masih dipakai untuk spectator HUD
const elToastContainer = document.getElementById("toast-container");

const elBottomPanel = document.getElementById("bottom-panel");
const elGameOver = document.getElementById("game-over-screen");
const elGoTitle = document.getElementById("go-title");
const elGoMsg = document.getElementById("go-message");
const elRematchStatus = document.getElementById("rematch-status");

const elPauseOverlay = document.getElementById("pause-overlay");
const elPauseReason = document.getElementById("pause-reason");
const elPauseTimer = document.getElementById("pause-timer");

let lastSpectatorSignature = "";
let _socket = null;

// Setup Event Listener Tombol Game Over
const btnRematch = document.getElementById("btn-rematch");
if (btnRematch) {
  btnRematch.onclick = () => {
    if (_socket) _socket.emit("rematch_request");
    btnRematch.disabled = true;
    btnRematch.innerText = "WAITING...";
  };
}

const btnQuit = document.getElementById("btn-quit");
if (btnQuit) btnQuit.onclick = () => alert("Quit feature coming soon!");

export function initUI() {
  _socket = initSocket();

  _socket.on("toast", (data) => {
    showToast(data.msg, data.type);
  });

  gameState.subscribe((state) => {
    updatePanelState(state);
    updatePauseState(state);
    if (myTeamId === -1) {
      renderSpectatorHUD(state);
    } else {
      updateArcana(state);
      // [NEW] Delegasikan ke hand.js
      updateHand(state);
    }
  });
}

// -- copy paste sisa fungsi helper ui.js yg tidak diubah --
function showToast(message, type = "info") {
  if (!elToastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;
  elToastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toast-out 0.3s forwards";
    toast.addEventListener("animationend", () => toast.remove());
  }, 3000);
}

function updatePanelState(state) {
  if (!elBottomPanel) return;
  if (state.phase === "loading") {
    elBottomPanel.classList.remove("panel-in-game");
    if (elGameOver) elGameOver.classList.add("hidden");
  } else if (state.phase === "battle") {
    elBottomPanel.classList.add("panel-in-game");
    if (elGameOver) elGameOver.classList.add("hidden");
    if (btnRematch) {
      btnRematch.disabled = false;
      btnRematch.innerText = "REMATCH";
    }
    if (elRematchStatus) elRematchStatus.classList.add("hidden");
  } else if (state.phase === "ended") {
    if (elPauseOverlay) elPauseOverlay.classList.add("hidden");
    elBottomPanel.classList.remove("panel-in-game");
    if (elGameOver) {
      elGameOver.classList.remove("hidden");
      const isWinner = state.winner === myTeamId;
      const isSpectator = myTeamId === -1;
      if (elGoTitle && elGoMsg) {
        if (isWinner) {
          elGoTitle.innerText = "VICTORY";
          elGoTitle.style.color = "#00FF00";
          elGoMsg.innerText = "The enemy King has fallen!";
        } else {
          elGoTitle.innerText = "DEFEAT";
          elGoTitle.style.color = "#FF0000";
          elGoMsg.innerText = "Your King has fallen...";
        }
      }
      if (state.rematchCount > 0) {
        elRematchStatus.classList.remove("hidden");
        elRematchStatus.innerText = `${state.rematchCount} / 2 PLAYERS READY`;
      } else {
        elRematchStatus.classList.add("hidden");
      }
    }
  }
}

function updateArcana(state) {
  if (myTeamId === -1) return;
  document.getElementById("info-row").style.display = "flex";
  const myPlayer = state.players[myTeamId];
  if (!myPlayer) return;
  const current = myPlayer.arcana;
  const pct = (current / MAX_ARCANA) * 100;
  elFill.style.width = `${pct}%`;
  elText.innerText = Math.floor(current);
  elFill.style.background =
    current >= MAX_ARCANA
      ? "linear-gradient(90deg, #e040fb, #ffffff)"
      : "linear-gradient(90deg, #7b1fa2, #e040fb)";
}

function renderSpectatorHUD(state) {
  if (!elHand.classList.contains("spectator-mode")) {
    elHand.innerHTML = "";
    elHand.classList.add("spectator-mode");
    document.getElementById("info-row").style.display = "none";
    document.getElementById("bottom-panel").style.pointerEvents = "auto"; 
  }
  const p0 = state.players[0]; const p1 = state.players[1];
  const currentSignature = `${p0.connected}-${p1.connected}`;
  
  // Force update jika paused berubah (biar tombol join muncul/hilang real time)
  // Atau biarkan dirty check signature handle. 
  // Kita tambahkan state.paused ke signature biar reactive terhadap pause event.
  const newSignature = `${currentSignature}-${state.paused}`;
  
  if (newSignature === lastSpectatorSignature) return;
  lastSpectatorSignature = newSignature;

  let html = `<div class="spectator-hud-container"><h2 style="color:#fff; margin:0;">SPECTATOR MODE</h2>`;
  
  if (!p0.connected) html += `<div style="text-align:center;"><div class="spectator-status-text">Solaris (Blue) is Disconnected!</div><button class="spectator-join-btn" onclick="window.joinGame(0)">TAKE OVER SOLARIS</button></div>`;
  
  if (!p1.connected) html += `<div style="text-align:center;"><div class="spectator-status-text">Noctis (Red) is Disconnected!</div><button class="spectator-join-btn" onclick="window.joinGame(1)">TAKE OVER NOCTIS</button></div>`;
  
  if (p0.connected && p1.connected) html += `<div class="spectator-status-text">Match in progress...</div>`;
  
  html += `</div>`;
  elHand.innerHTML = html;
}

function updatePauseState(state) {
    if (!elPauseOverlay) return;

    if (state.paused) {
        elPauseOverlay.classList.remove("hidden");
        
        // Update Reason Text
        if (elPauseReason) elPauseReason.innerText = state.pauseReason || "Game Paused";
        
        // Update Timer Countdown
        if (state.pauseEndTime) {
            const now = Date.now(); // Perlu sinkronisasi waktu server idealnya, tapi raw date cukup utk UI kasar
            // NOTE: State timestamp dari server ada di state.timestamp. 
            // Selisih (state.pauseEndTime - state.timestamp) lebih akurat jika jam client/server beda.
            
            // Kita pakai selisih dari data packet terakhir
            const remainingMs = state.pauseEndTime - (state.timestamp || Date.now()); 
            const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
            
            if (elPauseTimer) elPauseTimer.innerText = remainingSec;
        }
    } else {
        elPauseOverlay.classList.add("hidden");
    }
}

window.joinGame = (teamId) => {
  if (_socket) {
    _socket.emit("request_join_game", teamId);
    showToast("Requesting to join...", "info");
  }
};
