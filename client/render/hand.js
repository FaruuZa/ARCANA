import { CARDS } from "../../shared/data/cards.js";
import { selection, selectCard, clearSelection } from "../state/selection.js";
import { gameState, myTeamId } from "../state/gameState.js";
import { updateGhostPosition } from "./ghost.js";

const elHand = document.getElementById("hand-cards");

const elInfoPopup = document.createElement("div");
elInfoPopup.id = "card-info-popup";
document.body.appendChild(elInfoPopup);

let holdTimer = null;
let isInfoVisible = false;

// === MAIN UPDATE FUNCTION ===
export function updateHand(state) {
  if (myTeamId === -1) {
    // Bersihkan jika spectator (UI spectator dihandle ui.js)
    if (!elHand.classList.contains("spectator-mode")) elHand.innerHTML = "";
    return;
  }

  // Hapus mode spectator jika player masuk kembali
  if (elHand.classList.contains("spectator-mode")) {
    elHand.innerHTML = "";
    elHand.classList.remove("spectator-mode");
    document.getElementById("bottom-panel").style.pointerEvents = "auto";
  }

  const myPlayer = state.players[myTeamId];
  if (!myPlayer) return;

  const hand = myPlayer.hand || [];
  
  // === SMART DIFF RENDERING ===
  // 1. Mark semua elemen lama
  const existingEls = Array.from(elHand.children);
  const matchedIndices = new Set();

  // 2. Update / Create Kartu
  hand.forEach((cardId, index) => {
    const cardData = CARDS[cardId];
    if (!cardData) return;

    let cardEl = existingEls.find(el => el.dataset.index == index && el.dataset.id == cardId);
    
    if (!cardEl) {
        cardEl = existingEls.find(el => el.dataset.id == cardId && !matchedIndices.has(el) && !el.classList.contains("deploying"));
    }

    if (cardEl) {
        matchedIndices.add(cardEl);
        cardEl.dataset.index = index;
        cardEl.classList.remove("entering", "deploying", "dragging", "active", "disabled"); 
        cardEl.style.transform = "";
        cardEl.style.opacity = "";
    } else {
        cardEl = document.createElement("div");
        cardEl.className = "hand-card entering";
        cardEl.dataset.id = cardId;
        cardEl.dataset.index = index;
        
        cardEl.innerHTML = `
            <div class="card-cost">${cardData.cost}</div>
            <div class="card-type">${cardData.type}</div>
            <div class="card-name">${cardData.name}</div>
        `;
        
        // [UPDATE] Panggil setupCardInteractions yang sudah diperbaiki
        setupCardInteractions(cardEl, cardId, index, cardData);
        elHand.appendChild(cardEl);
    }

    // HITUNG POSISI (KIPAS)
    const isMobile = window.innerWidth <= 480;
    const spread = isMobile ? 55 : 60; 
    const center = (hand.length - 1) / 2;
    const xOffset = (index - center) * spread;
    const rotFactor = 5;
    const rot = (index - center) * rotFactor;
    const yFactor = isMobile ? 8 : 10;
    const yOffset = Math.abs(index - center) * yFactor;

    // Set CSS Variables untuk posisi default
    cardEl.style.setProperty("--x", `${xOffset}px`);
    cardEl.style.setProperty("--y", `${yOffset}px`);
    cardEl.style.setProperty("--rot", `${rot}deg`);
  });

  // 3. Remove Old Cards (Deploy Animation)
  existingEls.forEach(el => {
      // Jika elemen ini tidak dipakai lagi di hand baru
      // [FIX] Gunakan matchedIndices untuk memastikan elemen yang tidak terpakai benar-benar dihapus
      if (!matchedIndices.has(el) && !el.classList.contains("deploying")) {
          // [REQUEST 4] Animasi Deploy (Ke atas & Fade Out)
          // Kita asumsikan kartu hilang karena di-deploy
          el.classList.add("deploying");
          
          // Hapus setelah animasi selesai
          el.addEventListener("animationend", () => {
              el.remove();
          });
      } else if (!matchedIndices.has(el)) {
          // Fallback cleanup
          el.remove();
      }
  });

  // Selalu update status active/disabled tiap tick (karena arcana berubah terus)
  refreshCardClasses(hand, myPlayer.arcana);
}

function setupCardInteractions(cardEl, cardId, index, cardData) {
  cardEl.onpointerdown = (e) => {
    e.stopPropagation(); 
    
    // Logic Select
    const isAlreadySelected = (selection.index == index);
    let justSelected = false;

    if (!isAlreadySelected) {
        selectCard(cardId, index); 
        justSelected = true;
    }
    
    const currentPlayer = gameState.players[myTeamId];
    refreshCardClasses(currentPlayer ? currentPlayer.hand : [], currentPlayer ? currentPlayer.arcana : 0);

    // Setup Drag Variables
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = cardEl.getBoundingClientRect();
    const offsetX = startX - (rect.left + rect.width / 2);
    const offsetY = startY - (rect.top + rect.height / 2);

    let isDragging = false;
    const elBottomPanel = document.getElementById("bottom-panel");
    const panelHeight = elBottomPanel.clientHeight;
    const panelTopY = window.innerHeight - panelHeight;

    // Info Popup Timer
    holdTimer = setTimeout(() => {
      if (!isDragging) {
          showCardInfo(cardData);
          isInfoVisible = true;
      }
    }, 500);

    // 1. HANDLER GERAK (DRAG)
    const onMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            isDragging = true;
            clearTimeout(holdTimer);
            if (isInfoVisible) hideCardInfo();
            
            cardEl.classList.add("dragging");
            
            const xPos = moveEvent.clientX - (window.innerWidth / 2) - offsetX;
            const yPos = moveEvent.clientY - (window.innerHeight - 100) - offsetY;
            
            cardEl.style.transform = `translate(${xPos}px, ${yPos}px) translateX(-50%) scale(1)`;
            cardEl.style.opacity = "1";
        }
    };

    // 2. HANDLER KELUAR PANEL (STOP LISTENING)
    const onLeave = () => {
        if (isDragging) {
            // Reset Visual Kartu (Balik ke slot)
            // Ini penting agar kartu tidak 'nyangkut' visualnya di pinggir panel
            cardEl.classList.remove("dragging");
            cardEl.style.transform = ""; 
            cardEl.style.opacity = "1";
        }

        // [FIX UTAMA] Hentikan pendengaran event move DI SINI
        // Begitu mouse keluar panel, hand.js lepas tangan.
        // Biarkan pointer.js (yang handle canvas) mengurus logic 'Ghost' di map.
        elBottomPanel.removeEventListener("pointermove", onMove);
        elBottomPanel.removeEventListener("pointerleave", onLeave);
    };

    // 3. HANDLER LEPAS (DROP)
    const onUp = (upEvent) => {
        clearTimeout(holdTimer);
        if (isInfoVisible) hideCardInfo();

        // Bersihkan Listener
        elBottomPanel.removeEventListener("pointermove", onMove);
        elBottomPanel.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("pointerup", onUp);

        // Reset Visual Akhir
        cardEl.classList.remove("dragging");
        cardEl.style.transform = ""; 
        cardEl.style.opacity = "1";

        if (isDragging) {
            // Jika dilepas di luar panel (Game Area / Canvas)
            // Pointer.js yang akan handle spawn unit via 'window.pointerup'
            // Hand.js hanya perlu memastikan seleksi dibersihkan jika dilepas di dalam panel
            
            if (upEvent.clientY >= panelTopY) {
                // Dilepas DI DALAM PANEL -> Cancel Deploy
                clearSelection();
                updateGhostPosition(-1, -1);
            }
        } else {
            // Klik Tanpa Drag (Toggle Select)
            if (!justSelected) {
                selectCard(cardId, index);
            }
        }
    };

    elBottomPanel.addEventListener("pointermove", onMove);
    elBottomPanel.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerup", onUp);
  }
}

// === HELPER VISUAL CLASS ===
export function refreshCardClasses(hand, arcana) {
  const cardElements = elHand.children;
  for (let i = 0; i < cardElements.length; i++) {
    const el = cardElements[i];
    const cardId = hand[i];
    const cardData = CARDS[cardId];

    el.classList.remove("active", "disabled");

    // Add Active Class
    // [FIX] Cek ID juga agar tidak salah highlight kartu baru yang menempati index lama
    if (selection.index == i && selection.cardId == cardId) el.classList.add("active"); 

    // Add Disabled Class (Cek Duit)
    if (cardData && arcana < cardData.cost) {
        el.classList.add("disabled");
    }
  }
}

// === HELPER SHAKE (Dipanggil pointer.js) ===
export function shakeCardVisual(index) {
    const cardEl = elHand.children[index];
    if (cardEl) {
        const costEl = cardEl.querySelector(".card-cost");
        if (costEl) {
            costEl.classList.remove("shake-cost"); 
            void costEl.offsetWidth; // Trigger reflow
            costEl.classList.add("shake-cost");
        }
        // Shake kartunya juga biar kerasa
        cardEl.classList.remove("shake-cost");
        void cardEl.offsetWidth;
        cardEl.classList.add("shake-cost");
    }
}

// === INTERNAL: POPUP INFO ===
function showCardInfo(data) {
  const s = data.stats || {};
  let statsHtml = "";

  const list = [
    ["HP", s.hp], ["DMG", s.damage], ["SPD", s.speed],
    ["RNG", s.range], ["COUNT", s.count],
    ["AOE", s.aoeRadius ? s.aoeRadius + "m" : null],
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