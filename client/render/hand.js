import { CARDS } from "../../shared/data/cards.js";
import { selection, selectCard, clearSelection } from "../state/selection.js";
import { gameState, myTeamId } from "../state/gameState.js";
import { updateGhostPosition } from "./ghost.js";
import { setUnitOutline, getUnitScreenPosition } from "./units.js";
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

function setupCardInteractions(cardEl, cardId, initialIndex, cardData) {
  cardEl.onpointerdown = (e) => {
    e.stopPropagation(); 
    
    // [FIX] Always get fresh index from DOM because hand array shifts
    const currentIndex = parseInt(cardEl.dataset.index);

    // [PENTING] Set pointer capture agar tidak kehilangan fokus saat gerak cepat
    try {
        cardEl.setPointerCapture(e.pointerId);
    } catch (err) {}

    const isAlreadySelected = (selection.index == currentIndex);
    let justSelected = false;

    if (!isAlreadySelected) {
        selectCard(cardId, currentIndex); 
        justSelected = true;
    }
    
    // Refresh visual active state immediately
    const currentPlayer = gameState.players[myTeamId];
    refreshCardClasses(currentPlayer ? currentPlayer.hand : [], currentPlayer ? currentPlayer.arcana : 0);

    const startX = e.clientX;
    const startY = e.clientY;
    
    const rect = cardEl.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    
    const offsetX = startX - cardCenterX;
    const offsetY = startY - cardCenterY;

    let isDragging = false;
    let rAF = null; 

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
        if (rAF) cancelAnimationFrame(rAF); 
        
        // Remove window listeners used during drag
        window.removeEventListener("pointermove", onMove); // [FIX] Listen to window
        window.removeEventListener("pointerup", onUp);
        
        // Remove panel listeners (if any left)
        elBottomPanel.removeEventListener("pointermove", onMove);
        elBottomPanel.removeEventListener("pointerleave", onLeave);
        
        try {
            if (cardEl.hasPointerCapture(e.pointerId)) {
                cardEl.releasePointerCapture(e.pointerId);
            }
        } catch (err) {}
    };

    // 1. HANDLER KELUAR (RESET) - Triggered only if drag hasn't started or cancelled
    const onLeave = () => {
        // If we are already fully dragging (listeners on window), ignore panel leave
        if (isDragging) return; 

        if (isDragging) {
            cardEl.classList.remove("dragging");
            cardEl.style.transition = ""; 
            cardEl.style.transform = ""; 
            cardEl.style.opacity = "1";
            
            gameState.units.forEach(u => setUnitOutline(u.id, null));
            gameState.buildings.forEach(b => setUnitOutline(b.id, null));
            selection.pendingTargetId = null; 
        }
        stopInteractions();
    };

    // 2. HANDLER GERAK (DRAG)
    const onMove = (moveEvent) => {
        // [FIX] Removed "clientY < panelTopY" check. 
        // We WANT to follow mouse everywhere once dragging starts.

        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const dist = Math.hypot(dx, dy);

        if (!isDragging && dist > 5) {
            isDragging = true;
            clearTimeout(holdTimer);
            if (isInfoVisible) hideCardInfo();
            
            cardEl.classList.add("dragging");
            cardEl.style.transition = "none"; 
            
            // [FIX] Switch listeners to WINDOW for continuous dragging
            elBottomPanel.removeEventListener("pointermove", onMove);
            elBottomPanel.removeEventListener("pointerleave", onLeave);
            window.addEventListener("pointermove", onMove);
        }

        if (isDragging) {
            if (rAF) return; 

            rAF = requestAnimationFrame(() => {
                const xPos = moveEvent.clientX - (window.innerWidth / 2) - offsetX;
                const yPos = moveEvent.clientY - (window.innerHeight - 100) - offsetY;

                cardEl.style.transform = `translate(${xPos}px, ${yPos}px) translateX(-50%) scale(1.1)`;
                
                // [FIX] Hide card when dragging on board to prevent obscuring vision
                const isOnBoard = moveEvent.clientY < panelTopY;
                cardEl.style.opacity = isOnBoard ? "0" : "0.9"; 
                
                // [NEW] SINGLE TARGET RITUAL LOGIC
                if (cardData.type === 'RITUAL' && cardData.spellData && cardData.spellData.type === 'single_target') {
                    // Reset
                    gameState.units.forEach(u => setUnitOutline(u.id, null));
                    gameState.buildings.forEach(b => setUnitOutline(b.id, null));
                    selection.pendingTargetId = null; 

                    // [FIX] Get Canvas Rect for coordinate normalization
                    const canvas = document.querySelector("canvas");
                    if (!canvas) return;
                    const canvasRect = canvas.getBoundingClientRect();
                    
                    // Mouse relative to Canvas
                    const mouseX = moveEvent.clientX - canvasRect.left; 
                    const mouseY = moveEvent.clientY - canvasRect.top;
                    
                    let bestTarget = null;
                    let minD = Infinity;
                    const HIT_RADIUS = 60; 

                    const candidates = [...gameState.units, ...gameState.buildings];
                    
                    candidates.forEach(ent => {
                        if (ent.hp <= 0) return;
                        
                        const targetRule = cardData.spellData.targetTeam || 'enemy';
                        const isAlly = ent.team === myTeamId;
                        if (targetRule === 'enemy' && isAlly) return;
                        if (targetRule === 'ally' && !isAlly) return;

                        setUnitOutline(ent.id, 'white');

                        const pos = getUnitScreenPosition(ent.id);
                        if (!pos) return;
                        
                        const dx = mouseX - pos.x;
                        const dy = mouseY - pos.y;
                        const d = Math.sqrt(dx*dx + dy*dy);
                        
                        if (d < HIT_RADIUS && d < minD) {
                            minD = d;
                            bestTarget = ent;
                        }
                    });

                    if (bestTarget) {
                        setUnitOutline(bestTarget.id, 'green');
                        selection.pendingTargetId = bestTarget.id;
                    }
                }
                
                rAF = null; 
            });
        }
    };

    // 3. HANDLER LEPAS (DROP)
    const onUp = (upEvent) => {
        clearTimeout(holdTimer);
        if (isInfoVisible) hideCardInfo();
        stopInteractions();

        cardEl.classList.remove("dragging");
        cardEl.style.transition = ""; 
        cardEl.style.transform = ""; 
        cardEl.style.opacity = "1";
        
        gameState.units.forEach(u => setUnitOutline(u.id, null));
        gameState.buildings.forEach(b => setUnitOutline(b.id, null));

        if (isDragging) {
            if (upEvent.clientY >= panelTopY) {
                // Drop inside panel -> Cancel
                clearSelection();
                selection.pendingTargetId = null; 
                updateGhostPosition(-1, -1);
            }
        } else {
            // Click
            // [FIX] Use fresh index
            const idx = parseInt(cardEl.dataset.index);
            if (!justSelected) {
                selectCard(cardId, idx);
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