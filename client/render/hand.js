import { CARDS } from "../../shared/data/cards.js";
import { selection, selectCard, clearSelection } from "../state/selection.js";
import { gameState, myTeamId } from "../state/gameState.js";
import { updateGhostPosition } from "./ghost.js";
import { toRoman } from "../../utils/common.js";

const elHand = document.getElementById("hand-cards");

const elInfoPopup = document.createElement("div");
elInfoPopup.id = "card-info-popup";
document.body.appendChild(elInfoPopup);

let holdTimer = null;
let isInfoVisible = false;

// === MAIN UPDATE FUNCTION ===
export function updateHand(state) {
  if (myTeamId === -1) {
    if (!elHand.classList.contains("spectator-mode")) elHand.innerHTML = "";
    return;
  }

  if (elHand.classList.contains("spectator-mode")) {
    elHand.innerHTML = "";
    elHand.classList.remove("spectator-mode");
    document.getElementById("bottom-panel").style.pointerEvents = "auto";
  }

  const myPlayer = state.players[myTeamId];
  if (!myPlayer) return;

  const hand = myPlayer.hand || [];
  
  // === SMART DIFF RENDERING ===
  const existingEls = Array.from(elHand.children);
  const matchedIndices = new Set();
  const matchedCardIds = new Set(); // Track ID kartu yang sudah ada di hand

  // 1. Create / Update Kartu
  hand.forEach((cardId, index) => {
    const cardData = CARDS[cardId];
    if (!cardData) return;

    // Cari elemen yang sudah ada untuk kartu ini di index ini
    let cardEl = existingEls.find(el => el.dataset.index == index && el.dataset.id == cardId);
    
    // Jika tidak ada di index yang sama, cari di mana saja (mungkin geser)
    if (!cardEl) {
        cardEl = existingEls.find(el => el.dataset.id == cardId && !matchedIndices.has(el) && !el.classList.contains("deploying"));
    }

    if (cardEl) {
        // UPDATE Existing Card
        matchedIndices.add(cardEl);
        matchedCardIds.add(cardId);

        // Update index attribute if changed
        if (cardEl.dataset.index != index) {
            cardEl.dataset.index = index;
            // Update interaction handler context (closure)
            // Note: Idealnya kita tidak re-bind event listener setiap frame.
            // Tapi karena setupCardInteractions closure ke variabel 'index', kita perlu update.
            // Solusi bersih: simpan index di dataset dan baca dari dataset saat event trigger.
            // Untuk sekarang, kita re-assign handler properti agar index baru terbaca.
            cardEl.onpointerdown = null; 
            setupCardInteractions(cardEl, cardId, index, cardData);
        }
        
        // Reset state visual jika tidak sedang di-drag
        if (!cardEl.classList.contains("dragging")) {
             cardEl.style.transform = ""; 
             cardEl.style.opacity = "";
             // Hapus class entering jika sudah selesai animasi atau bukan baru
             if (cardEl.style.animationName === 'none') {
                 cardEl.classList.remove("entering");
             }
        }
        
    } else {
        // CREATE New Card
        cardEl = document.createElement("div");
        
        let themeClass = "card-neutral";
        let sigilClass = "sigil-neutral";
        
        if (cardData.minFaction === 'solaris') { themeClass = "card-solaris"; sigilClass = "sigil-solaris"; }
        if (cardData.minFaction === 'noctis') { themeClass = "card-noctis"; sigilClass = "sigil-noctis"; }
        
        // [FIX] Taboo Logic
        if (cardData.isTaboo) {
            themeClass = "card-taboo";
            sigilClass = "sigil-taboo";
        }
        
        // [FIX] Type Logic
        const rawType = (cardData.type || "").toLowerCase();
        let typeClass = 'type-spell'; 
        let typeLabel = "SPELL"; 
        
        if(rawType === 'vessel' || rawType === 'unit') { typeClass = 'type-unit'; typeLabel = "VESSEL"; }
        else if(rawType === 'ritual' || rawType === 'spell') { typeClass = 'type-spell'; typeLabel = "RITUAL"; }
        else if(rawType === 'sanctum' || rawType === 'building') { typeClass = 'type-building'; typeLabel = "SANCTUM"; }

        cardEl.className = `hand-card entering card-visual ${themeClass}`;
        cardEl.dataset.id = cardId;
        cardEl.dataset.index = index;
        
        cardEl.innerHTML = `
            <div class="card-roman-cost">${toRoman(cardData.cost)}</div>
            <div class="card-type-indicator ${typeClass}" title="${typeLabel}"></div>
            <div class="card-sigil ${sigilClass}"></div>
            <div class="card-name">${cardData.name}</div>
            <div style="position:absolute; bottom:2px; left:4px; font-size:6px; color:#888; text-transform:uppercase;">${typeLabel}</div>
        `;
        
        setupCardInteractions(cardEl, cardId, index, cardData);
        elHand.appendChild(cardEl);
        
        // Hapus class entering setelah animasi selesai
        cardEl.addEventListener('animationend', () => {
             cardEl.classList.remove('entering');
        }, { once: true });
    }

    // HITUNG POSISI (KIPAS)
    // Pastikan kalkulasi ini sinkron dengan input/drag logic
    if (!cardEl.classList.contains("dragging")) {
        const isMobile = window.innerWidth <= 480;
        const spread = isMobile ? 55 : 60; 
        const center = (hand.length - 1) / 2;
        const xOffset = (index - center) * spread;
        const rotFactor = 5;
        const rot = (index - center) * rotFactor;
        const yFactor = isMobile ? 8 : 10;
        const yOffset = Math.abs(index - center) * yFactor;

        cardEl.style.setProperty("--x", `${xOffset}px`);
        cardEl.style.setProperty("--y", `${yOffset}px`);
        cardEl.style.setProperty("--rot", `${rot}deg`);
    }
  });

  // 2. Remove Old Cards (Deploy/Discard)
  existingEls.forEach(el => {
      // Jika elemen ini tidak ada di set matchedIndices, berarti hilang dari hand
      if (!matchedIndices.has(el) && !el.classList.contains("deploying")) {
          // Animasi keluar
          el.classList.add("deploying");
          // Pastikan pointer events mati
          el.style.pointerEvents = "none";
          
          el.addEventListener("animationend", () => {
              el.remove();
          });
      }
  });

  refreshCardClasses(hand, myPlayer.arcana);
}

function setupCardInteractions(cardEl, cardId, index, cardData) {
  cardEl.onpointerdown = (e) => {
    e.stopPropagation(); 

    // [PENTING] Set pointer capture agar tidak kehilangan fokus saat gerak cepat
    try {
        cardEl.setPointerCapture(e.pointerId);
    } catch (err) {}

    const isAlreadySelected = (selection.index == index);
    let justSelected = false;

    if (!isAlreadySelected) {
        selectCard(cardId, index); 
        justSelected = true;
    }
    
    const currentPlayer = gameState.players[myTeamId];
    refreshCardClasses(currentPlayer ? currentPlayer.hand : [], currentPlayer ? currentPlayer.arcana : 0);

    const startX = e.clientX;
    const startY = e.clientY;
    
    // Hitung offset agar kartu tidak 'teleport' ke tengah mouse saat mulai drag
    // Kita ingin memegang kartu tepat di bagian yang kita klik
    // GUNAKAN getBoundingClientRect untuk akurasi posisi visual saat ini
    const rect = cardEl.getBoundingClientRect();
    
    // Offset dari Center Kartu (ini yang ingin dipertahankan relatif terhadap mouse)
    // Mouse Pos - Card Center Pos
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    
    const offsetX = startX - cardCenterX;
    const offsetY = startY - cardCenterY;

    let isDragging = false;
    let rAF = null; // Variable untuk menyimpan ID animation frame

    const elBottomPanel = document.getElementById("bottom-panel");
    const panelRect = elBottomPanel.getBoundingClientRect(); 
    const panelTopY = panelRect.top; 

    holdTimer = setTimeout(() => {
      if (!isDragging) {
          showCardInfo(cardData);
          isInfoVisible = true;
      }
    }, 500);

    // CLEANUP FUNCTION
    const stopInteractions = () => {
        if (rAF) cancelAnimationFrame(rAF); // Stop loop visual
        
        elBottomPanel.removeEventListener("pointermove", onMove);
        elBottomPanel.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("pointerup", onUp);
        
        try {
            if (cardEl.hasPointerCapture(e.pointerId)) {
                cardEl.releasePointerCapture(e.pointerId);
            }
        } catch (err) {}
    };

    // 1. HANDLER KELUAR (RESET)
    const onLeave = () => {
        if (isDragging) {
            cardEl.classList.remove("dragging");
            // [FIX] Kembalikan transition agar saat balik ke tangan terlihat mulus
            cardEl.style.transition = ""; 
            cardEl.style.transform = ""; 
            cardEl.style.opacity = "1";
        }
        stopInteractions();
    };

    // 2. HANDLER GERAK (DRAG)
    const onMove = (moveEvent) => {
        // [Safety Mobile] Cek keluar panel atas
        if (moveEvent.clientY < panelTopY) {
            onLeave();
            return;
        }

        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const dist = Math.hypot(dx, dy);

        // Ambang batas drag (5px)
        if (!isDragging && dist > 5) {
            isDragging = true;
            clearTimeout(holdTimer);
            if (isInfoVisible) hideCardInfo();
            
            cardEl.classList.add("dragging");
            
            // [FIX UTAMA 1] Matikan CSS Transition agar ngikutin mouse 100% realtime
            cardEl.style.transition = "none"; 
        }

        if (isDragging) {
            // [FIX UTAMA 2] Gunakan requestAnimationFrame untuk performa visual
            // Mencegah update DOM berlebihan yang bikin stutter
            if (rAF) return; // Jika frame sebelumnya belum kelar render, skip logic visual ini

            rAF = requestAnimationFrame(() => {
                // Hitung posisi relatif terhadap tengah layar (karena transform CSS mainnya disitu)
                // Sesuaikan logika ini dengan CSS container Anda jika perlu
                const xPos = moveEvent.clientX - (window.innerWidth / 2) - offsetX;
                const yPos = moveEvent.clientY - (window.innerHeight - 100) - offsetY;

                // [FIX VISUAL] Tambahkan scale sedikit biar kelihatan sedang diangkat
                cardEl.style.transform = `translate(${xPos}px, ${yPos}px) translateX(-50%) scale(1.1)`;
                cardEl.style.opacity = "0.9"; // Sedikit transparan biar kelihatan map di belakangnya
                
                rAF = null; // Reset flag agar frame berikutnya bisa jalan
            });
        }
    };

    // 3. HANDLER LEPAS (DROP)
    const onUp = (upEvent) => {
        clearTimeout(holdTimer);
        if (isInfoVisible) hideCardInfo();
        stopInteractions();

        // Reset Visual
        cardEl.classList.remove("dragging");
        // [FIX] Hapus override style transition & transform agar kembali diatur oleh CSS Class
        cardEl.style.transition = ""; 
        cardEl.style.transform = ""; 
        cardEl.style.opacity = "1";

        if (isDragging) {
            // Cek Drop Zone
            if (upEvent.clientY >= panelTopY) {
                // Drop di dalam panel -> Cancel
                clearSelection();
                updateGhostPosition(-1, -1);
            }
        } else {
            // Klik (Tap)
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