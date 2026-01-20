import { gameState, myTeamId } from "../state/gameState.js";
import { MAX_ARCANA } from "../../shared/constants.js";
import { CARDS } from "../../shared/data/cards.js";
import { selection, selectCard } from "../state/selection.js";
import { initSocket } from "../net/socket.js";

const elFill = document.getElementById("elixir-fill");
const elText = document.getElementById("elixir-text");
const elHand = document.getElementById("hand-cards");

// [FIX] Tambahkan Selector Panel & Game Over
const elBottomPanel = document.getElementById("bottom-panel");
const elGameOver = document.getElementById("game-over-screen");
const elGoTitle = document.getElementById("go-title");
const elGoMsg = document.getElementById("go-message");
const elRematchStatus = document.getElementById("rematch-status"); // [NEW]

// [NEW] Buat Container Popup Info sekali saja
const elInfoPopup = document.createElement("div");
elInfoPopup.id = "card-info-popup";
document.body.appendChild(elInfoPopup);

let lastHandSignature = "";
let _latestState = null;

// Variables untuk Hold Logic
let holdTimer = null;
let isInfoVisible = false;

// Setup Event Listener Tombol Game Over (Pastikan ID tombol ada di HTML)
const btnRematch = document.getElementById("btn-rematch");
if (btnRematch) {
    btnRematch.onclick = () => {
        const socket = initSocket();
        socket.emit("rematch_request");
        
        // Visual Feedback Immediate
        btnRematch.disabled = true;
        btnRematch.innerText = "WAITING...";
    };
}

const btnQuit = document.getElementById("btn-quit");
if (btnQuit) btnQuit.onclick = () => alert("Quit feature coming soon!");

export function initUI() {
  gameState.subscribe((state) => {
    _latestState = state;
    
    // [FIX] PANGGIL FUNGSI UPDATE PANEL DI SINI
    updatePanelState(state);

    if (myTeamId === -1) {
      renderSpectatorHUD(state);
    } else {
      updateArcana(state);
      updateHand(state);
    }
  });
}

// [FIX] FUNGSI LOGIKA PANEL (CURTAIN)
function updatePanelState(state) {
    // Pastikan elemen ada
    if (!elBottomPanel) return;

    if (state.phase === 'loading') {
        // Mode Loading: Tutup Tirai
        elBottomPanel.classList.remove("panel-in-game");
        if (elGameOver) elGameOver.classList.add("hidden");
    } 
    else if (state.phase === 'battle') {
        // Mode Battle: Buka Tirai (Panel Turun)
        elBottomPanel.classList.add("panel-in-game");
        if (elGameOver) elGameOver.classList.add("hidden");
        if (btnRematch) {
            btnRematch.disabled = false;
            btnRematch.innerText = "REMATCH";
        }
        if (elRematchStatus) elRematchStatus.classList.add("hidden");
    } 
    else if (state.phase === 'ended') {
        // Mode Game Over: Tutup Tirai Lagi
        elBottomPanel.classList.remove("panel-in-game");
        
        // Tampilkan Game Over Screen
        if (elGameOver) {
            elGameOver.classList.remove("hidden");
            
            const isWinner = state.winner === myTeamId;
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

function renderSpectatorHUD(state) {
  if (!elHand.classList.contains("spectator-mode")) {
    elHand.innerHTML = `<h2 style="color:#fff; text-align:center;">SPECTATOR MODE</h2>`;
    elHand.classList.add("spectator-mode");
    document.getElementById("info-row").style.display = "none";
    document.getElementById("bottom-panel").style.pointerEvents = "none";
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
  elFill.style.background = current >= MAX_ARCANA ? 
    "linear-gradient(90deg, #e040fb, #ffffff)" : "linear-gradient(90deg, #7b1fa2, #e040fb)";
}

function updateHand(state) {
  if (myTeamId === -1) return;

  if (elHand.classList.contains("spectator-mode")) {
      elHand.innerHTML = "";
      elHand.classList.remove("spectator-mode");
      document.getElementById("bottom-panel").style.pointerEvents = "auto";
  }

  const myPlayer = state.players[myTeamId];
  if (!myPlayer) return;

  const hand = myPlayer.hand || [];
  const signature = hand.join(",");

  if (signature !== lastHandSignature) {
    elHand.innerHTML = "";
    lastHandSignature = signature;

    hand.forEach((cardId, index) => {
      const cardData = CARDS[cardId];
      if (!cardData) return;

      const cardEl = document.createElement("div");
      cardEl.className = "hand-card";

      const isMobile = window.innerWidth <= 480;
      const spread = isMobile ? 50 : 70; 
      const center = (hand.length - 1) / 2;
      const xOffset = (index - center) * spread;
      const rotFactor = 5; 
      const rot = (index - center) * rotFactor;
      const yFactor = isMobile ? 8 : 10;
      const yOffset = Math.abs(index - center) * yFactor;

      cardEl.style.setProperty("--x", `${xOffset}px`);
      cardEl.style.setProperty("--y", `${yOffset}px`);
      cardEl.style.setProperty("--rot", `${rot}deg`);

      cardEl.innerHTML = `
        <div class="card-cost">${cardData.cost}</div>
        <div class="card-type">${cardData.type}</div>
        <div class="card-name">${cardData.name}</div>
      `;

      // === [LOGIC INTERAKSI: CLICK, DRAG, HOLD] ===
      cardEl.onpointerdown = (e) => {
        e.stopPropagation(); 
        
        // A. Validasi Uang
        const myCurrentPlayer = _latestState.players[myTeamId];
        const freshArcana = myCurrentPlayer ? myCurrentPlayer.arcana : 0;
        
        if (freshArcana < cardData.cost) {
            const costEl = cardEl.querySelector(".card-cost");
            if (costEl) {
                costEl.classList.add("shake-cost");
                setTimeout(() => costEl.classList.remove("shake-cost"), 300);
            }
            return;
        }

        // B. Select Card
        selectCard(cardId, index);
        refreshCardClasses(hand, freshArcana);

        // C. Setup Hold Timer
        const startX = e.clientX;
        const startY = e.clientY;

        holdTimer = setTimeout(() => {
            showCardInfo(cardData);
            isInfoVisible = true;
        }, 500);

        // D. Listener Gerak/Lepas
        const onMove = (moveEvent) => {
            const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
            if (dist > 10) {
                clearTimeout(holdTimer);
                if (isInfoVisible) hideCardInfo(); 
            }
        };

        const onUp = () => {
            clearTimeout(holdTimer);
            if (isInfoVisible) hideCardInfo();
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      };

      elHand.appendChild(cardEl);
      cardEl.classList.add("entering");
    });
  }

  refreshCardClasses(hand, myPlayer.arcana);
}

function refreshCardClasses(hand, arcana) {
  const cardElements = elHand.children;
  for (let i = 0; i < cardElements.length; i++) {
    const el = cardElements[i];
    const cardId = hand[i];
    const cardData = CARDS[cardId];

    el.classList.remove("active", "disabled");

    if (selection.index === i) el.classList.add("active");
    if (cardData && arcana < cardData.cost) el.classList.add("disabled");
  }
}

// === HELPER POPUP ===
function showCardInfo(data) {
    const s = data.stats || {};
    let statsHtml = "";
    
    const list = [
        ['HP', s.hp], 
        ['DMG', s.damage], 
        ['SPD', s.speed], 
        ['RNG', s.range],
        ['COUNT', s.count],
        ['AOE', s.aoeRadius ? s.aoeRadius + "m" : null]
    ];

    list.forEach(([label, val]) => {
        if (val) {
            statsHtml += `
                <div class="stat-row">
                    <span class="stat-label">${label}</span>
                    <span>${val}</span>
                </div>`;
        }
    });

    elInfoPopup.innerHTML = `
        <div class="info-title">${data.name}</div>
        <div class="info-desc">${data.description || "No description."}</div>
        <div class="info-stats">${statsHtml}</div>
    `;
    elInfoPopup.classList.add("visible");
}

function hideCardInfo() {
    elInfoPopup.classList.remove("visible");
    isInfoVisible = false;
}