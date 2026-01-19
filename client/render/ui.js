import { gameState, myTeamId } from "../state/gameState.js";
import { MAX_ARCANA } from "../../shared/constants.js";
import { CARDS } from "../../shared/data/cards.js";
import { selection, selectCard } from "../state/selection.js";

const elFill = document.getElementById("elixir-fill");
const elText = document.getElementById("elixir-text");
const elHand = document.getElementById("hand-cards");

let lastHandSignature = "";

// VARIABEL BARU: Simpan state terakhir agar bisa dibaca oleh Click Event
let _latestState = null;

export function initUI() {
  gameState.subscribe((state) => {
    _latestState = state; // Selalu update referensi state terbaru
    if (myTeamId === -1) {
      renderSpectatorHUD(state);
    } else {
      updateArcana(state);
      updateHand(state);
    }
  });
}

function renderSpectatorHUD(state) {
  // Ubah tampilan Hand menjadi Info Spectator
  // Kita cek apakah HUD sudah diubah mode spectator belum agar tidak render terus
  if (!elHand.classList.contains("spectator-mode")) {
    elHand.innerHTML = `
            <div style="
                display:flex; flex-direction:column; align-items:center; justify-content:center; 
                height:100%; color:#888; font-family:var(--font-title);">
                <h2 style="margin:0; color:#fff;">SPECTATOR MODE</h2>
                <p style="margin:5px 0; font-size:12px;">Watching Battle</p>
            </div>
        `;
    elHand.classList.add("spectator-mode");

    // Sembunyikan Arcana Bar
    document.getElementById("info-row").style.display = "none";

    // Non-aktifkan pointer events di panel bawah
    elBottomPanel.style.pointerEvents = "none";
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

  if (current >= MAX_ARCANA) {
    elFill.style.background = "linear-gradient(90deg, #e040fb, #ffffff)";
  } else {
    elFill.style.background = "linear-gradient(90deg, #7b1fa2, #e040fb)";
  }
}

function updateHand(state) {
  if (myTeamId === -1) return;
  if (elHand.classList.contains("spectator-mode")) {
      elHand.innerHTML = "";
      elHand.classList.remove("spectator-mode");
      elBottomPanel.style.pointerEvents = "auto";
  }

  const myPlayer = state.players[myTeamId];
  if (!myPlayer) return;

  const hand = myPlayer.hand || [];
  // Hapus const currentArcana di sini karena itu penyebab bug (data lama)

  const signature = hand.join(",");

  if (signature !== lastHandSignature) {
    elHand.innerHTML = "";
    lastHandSignature = signature;

    hand.forEach((cardId, index) => {
      const cardData = CARDS[cardId];
      if (!cardData) return;

      const cardEl = document.createElement("div");
      cardEl.className = "hand-card";

      const spread = 70;
      const center = (hand.length - 1) / 2;
      const xOffset = (index - center) * spread;
      const rot = (index - center) * 5;
      const yOffset = Math.abs(index - center) * 10;

      cardEl.style.setProperty("--x", `${xOffset}px`);
      cardEl.style.setProperty("--y", `${yOffset}px`);
      cardEl.style.setProperty("--rot", `${rot}deg`);

      cardEl.innerHTML = `
        <div class="card-cost">${cardData.cost}</div>
        <div class="card-type">${cardData.type}</div>
        <div class="card-name">${cardData.name}</div>
      `;

      // === PERBAIKAN BUG DI SINI ===
      cardEl.onclick = () => {
        // Ambil Arcana TERBARU dari _latestState, bukan dari closure lama
        if (!_latestState) return;
        const freshArcana = _latestState.players[0].arcana;

        if (freshArcana < cardData.cost) {
          // Animasi Shake
          const costEl = cardEl.querySelector(".card-cost");
          if (costEl) {
            costEl.classList.add("shake-cost");
            setTimeout(() => costEl.classList.remove("shake-cost"), 300);
          }
          return;
        }

        selectCard(cardId, index);
        // Kita panggil refresh manual dengan state terbaru agar visual langsung responsif
        refreshCardClasses(hand, freshArcana);
      };

      elHand.appendChild(cardEl);
      cardEl.classList.add("entering");
    });
  }

  // Visual Update (Class) berjalan tiap tick, jadi visualnya benar
  // Masalah sebelumnya cuma di logic 'onclick'
  refreshCardClasses(hand, myPlayer.arcana);
}

function refreshCardClasses(hand, arcana) {
  const cardElements = elHand.children;

  for (let i = 0; i < cardElements.length; i++) {
    const el = cardElements[i];
    const cardId = hand[i];
    const cardData = CARDS[cardId];

    el.classList.remove("active", "disabled");

    if (selection.index === i) {
      el.classList.add("active");
    }

    if (cardData && arcana < cardData.cost) {
      el.classList.add("disabled");
    }
  }
}
