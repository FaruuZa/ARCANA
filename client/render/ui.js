import { gameState, myTeamId } from "../state/gameState.js";
import { MAX_ARCANA, DECK_SIZE } from "../../shared/constants.js";
import { CARDS } from "../../shared/data/cards.js"; // [NEW] Import CARDS
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

const elOmenOverlay = document.getElementById("omen-overlay");
const elOmenTitle = document.getElementById("omen-title");
const elOmenDesc = document.getElementById("omen-desc");

let lastSpectatorSignature = "";
let _socket = null;

// Deck Builder State
let selectedCards = new Set();
let isDeckSubmitted = false;

// Setup Event Listener Tombol Game Over
const btnRematch = document.getElementById("btn-rematch");
if (btnRematch) {
  btnRematch.onclick = () => {
    if (_socket) _socket.emit("rematch_request");
    // Reset Deck Builder State
    selectedCards.clear();
    isDeckSubmitted = false;
    hasShownReveal = false; // [NEW] Reset reveal flag
    lastRevealedFaction = null;
    
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

  // [NEW] Curtain Drop Handler
  _socket.on("curtain_drop", () => {
      // Logic: Just insure panel is in-game state
      // Actually state.phase -> 'battle' will handle this in updatePanelState
      // But we can add sound or special effect here if needed.
  });

  // [NEW] Omen Announcement Handler
  _socket.on("omen_announcement", (data) => {
      // Show Overlay
      if(elOmenOverlay) {
          elOmenTitle.innerText = data.name;
          elOmenDesc.innerText = data.description;
          
          elOmenTitle.style.animation = 'none';
          elOmenOverlay.offsetHeight; /* trigger reflow */
          elOmenTitle.style.animation = null; 
          
          elOmenOverlay.classList.add("visible");
          
          // Hide after 6 seconds (enough to read)
          setTimeout(() => {
              elOmenOverlay.classList.remove("visible");
          }, 6000);
      }
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

  // -- PHASE: PREPARATION / DECK BUILDING --
  if (state.phase === "preparation" || state.phase === "deck_building") {
      elBottomPanel.classList.remove("panel-in-game"); 
      // Panel Menutup (Naik). Di dalam panel ini kita render Deck Builder
      
      // Jika sudah submit/ready, tampilkan "Waiting for Opponent"
      if (myTeamId !== -1 && state.players[myTeamId]) {
           if (state.players[myTeamId].ready) {
               renderWaitingScreen();
           } else {
               renderDeckBuilder(state.players[myTeamId].faction);
           }
      }
      
      if (elGameOver) elGameOver.classList.add("hidden");

  // -- PHASE: BATTLE --
  } else if (state.phase === "battle") {
    elBottomPanel.classList.add("panel-in-game"); // Turun
    
    // Clear Deck Builder Content to save memory/visuals
    if(elBottomPanel.querySelector("#deck-builder")) {
        // [FIX] DO NOT use innerHTML = "" because it wipes #game-hud
        const db = document.getElementById("deck-builder");
        if(db) db.remove();
        
         // Restore Game Over Screen hidden
         if (elGameOver) elGameOver.classList.add("hidden");
    }
    
    // Ensure HUD is visible (css handles this via opacity on panel-in-game)
    
    if (btnRematch) {
      btnRematch.disabled = false;
      btnRematch.innerText = "REMATCH";
    }
    if (elRematchStatus) elRematchStatus.classList.add("hidden");
    
  // -- PHASE: ENDED --
  } else if (state.phase === "ended") {
    if (elPauseOverlay) elPauseOverlay.classList.add("hidden");
    elBottomPanel.classList.remove("panel-in-game"); // Naik lagi
    
    if (elGameOver) {
      elGameOver.classList.remove("hidden");
      const isWinner = state.winner === myTeamId;
      if (elGoTitle && elGoMsg) {
          // [LORE] Game Over Text
          const myFaction = (state.players[myTeamId] && state.players[myTeamId].faction) || "neutral";
          
          if (isWinner) {
              if (myFaction === 'solaris') {
                  elGoTitle.innerText = "LIGHT PREVAILS";
                  elGoTitle.style.color = "#FFD700";
                  elGoMsg.innerText = "The Order of Solaris has secured destiny.";
              } else if (myFaction === 'noctis') {
                  elGoTitle.innerText = "THE VOID CONSUMES";
                  elGoTitle.style.color = "#9C27B0";
                  elGoMsg.innerText = "The Cult of Noctis has broken fate.";
              } else {
                  elGoTitle.innerText = "VICTORY";
                  elGoTitle.style.color = "#00FF00";
                  elGoMsg.innerText = "The enemy King has fallen!";
              }
          } else {
              elGoTitle.innerText = "DEFEAT";
              elGoTitle.style.color = "#888"; // Grey/Dead
              elGoMsg.innerText = "Your legacy turns to dust...";
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

import { toRoman } from "../../utils/common.js";

// Deck Builder State (Already declared above)
let dbFilter = "all"; // all, unit, spell, taboo
let dbSearch = "";
let currentDbFaction = "neutral"; 

let hasShownReveal = false; // [NEW] Flag for Faction Reveal
let isRevealing = false;
let lastRevealedFaction = null;

function renderFactionReveal(faction) {
    if (isRevealing || hasShownReveal) return; // Prevent double trigger
    
    // Only trigger if faction changed or first time
    if (lastRevealedFaction === faction && hasShownReveal) return;

    isRevealing = true;
    lastRevealedFaction = faction;
    
    // Create Overlay (Or reuse existing Omen one? Better make new one for distinct style)
    let overlay = document.getElementById("faction-reveal-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "faction-reveal-overlay";
        document.body.appendChild(overlay);
    }
    
    const isSolaris = faction === 'solaris';
    const title = isSolaris ? "THE ORDER OF SOLARIS" : "THE CULT OF NOCTIS";
    const subtitle = isSolaris ? "DESTINY IS ILLUMINATED" : "FATE IS BROKEN";
    const lore = isSolaris 
        ? "You have been chosen to uphold the light." 
        : "You have been chosen to embrace the void.";
    
    const color = isSolaris ? "#FFD700" : "#9C27B0";
    const bg = isSolaris 
        ? "linear-gradient(45deg, #000, #332a00)" 
        : "linear-gradient(45deg, #000, #1a0018)";

    overlay.style.background = bg;
    overlay.innerHTML = `
        <div class="reveal-content">
            <div class="reveal-subtitle">${subtitle}</div>
            <div class="reveal-title" style="color:${color}; text-shadow: 0 0 20px ${color};">${title}</div>
            <div class="reveal-lore">${lore}</div>
        </div>
    `;
    
    // Force Reflow
    overlay.classList.remove("visible");
    overlay.offsetHeight; 
    overlay.classList.add("visible");
    
    // Hide logic
    setTimeout(() => {
        overlay.classList.remove("visible");
        isRevealing = false;
        hasShownReveal = true;
        
        // Trigger UI Update to show Deck Builder
        // Note: We rely on the next game loop update or force it if needed.
        // But since updatePanelState runs every tick, it will see hasShownReveal=true
        // and render Deck Builder automatically.
    }, 4000); // 4 Seconds Cinematic
}

// [NEW] Advanced Render Deck Builder
function renderDeckBuilder(faction) {
    // [CHECK] Don't render if we haven't shown reveal yet
    if (!hasShownReveal && !isRevealing && !isDeckSubmitted) {
        renderFactionReveal(faction);
        return;
    }
    if (isRevealing) return; // Wait for animation

    let db = document.getElementById("deck-builder");
    if (db) return; // Already rendered

    currentDbFaction = faction; // [FIX] Store faction
    
    db = document.createElement("div");
    db.id = "deck-builder";
    
    const factionDisplay = faction === 'solaris' ? "Solaris" : "Noctis";
    const lore = faction === 'solaris' 
        ? "Light reveals all."
        : "Shadows tear the pages of destiny.";

    db.innerHTML = `
        <div class="db-top-bar">
            <div class="db-header-row">
                <div class="db-faction-title">${factionDisplay}</div>
                <div class="db-controls">
                    <button class="db-filter-btn active" data-filter="all">All</button>
                    <button class="db-filter-btn" data-filter="vessel">Vessel</button>
                    <button class="db-filter-btn" data-filter="ritual">Ritual</button>
                    <button class="db-filter-btn" data-filter="taboo">Taboo</button>
                </div>
            </div>
            <input type="text" class="db-search" id="db-search" placeholder="Search cards...">
        </div>
        
        <div class="db-content-area">
            <div class="db-grid-container">
                <div class="db-grid" id="db-card-grid"></div>
            </div>
            
            <div class="db-deck-sidebar">
                <div style="font-size:10px; color:#888; margin-bottom:5px;">SELECTED DECK (<span id="db-count-val">0</span>/${DECK_SIZE})</div>
                <div class="db-deck-list" id="db-deck-list"></div>
            </div>
        </div>

        <div class="db-footer">
            <div style="font-size:10px; color:#555;">${lore}</div>
            <button id="btn-submit-deck">BATTLE</button>
        </div>
        
        <!-- Details Overlay attached to DB -->
        <div id="card-detail-overlay"></div>
    `;
    
    elBottomPanel.appendChild(db);
    
    // Attach Listeners
    db.querySelectorAll(".db-filter-btn").forEach(btn => {
        btn.onclick = (e) => {
            db.querySelectorAll(".db-filter-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            dbFilter = e.target.dataset.filter;
            refreshCardGrid(currentDbFaction); // [FIX] Use stored faction
        }
    });
    
    db.querySelector("#db-search").oninput = (e) => {
        dbSearch = e.target.value.toLowerCase();
        refreshCardGrid(currentDbFaction);
    };
    
    db.querySelector("#btn-submit-deck").onclick = submitDeck;
    
    refreshCardGrid(currentDbFaction);
    updateDeckListUI();
}

function refreshCardGrid(faction) {
    const grid = document.getElementById("db-card-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    const validCards = Object.values(CARDS).filter(c => {
         if (c.isToken) return false;
         
         // Faction Check
         if (c.minFaction !== 'neutral' && c.minFaction !== faction) return false;
         
         // Search
         if (dbSearch && !c.name.toLowerCase().includes(dbSearch)) return false;
         
         // Filter
         const type = (c.type || "").toLowerCase();
         if (dbFilter !== 'all') {
             if (dbFilter === 'taboo') {
                 if (!c.isTaboo) return false;
             } else {
                 if (type !== dbFilter) return false;
             }
         }
         
         return true;
    });

    validCards.forEach(card => {
        const el = createCardVisual(card);
        el.classList.add("db-card-new");
        el.onclick = () => toggleCardSelection(card.id);
        
        // Dim if not selected but deck full
        if (!selectedCards.has(card.id) && selectedCards.size >= DECK_SIZE) {
            el.classList.add("dimmed");
        }
        // Highlight if selected
        if(selectedCards.has(card.id)) {
            el.style.borderColor = "#fff";
            el.style.transform = "scale(0.95)";
            el.style.opacity = "0.5"; 
        }
        
        // Inspect on Right Click
        el.oncontextmenu = (e) => {
            e.preventDefault();
            showCardDetail(card);
        }

        grid.appendChild(el);
    });
}

function createCardVisual(card) {
    const el = document.createElement("div");
    
    // Determine Visual Theme
    let themeClass = "card-neutral";
    let sigilClass = "sigil-neutral";
    
    if (card.minFaction === 'solaris') { themeClass = "card-solaris"; sigilClass = "sigil-solaris"; }
    if (card.minFaction === 'noctis') { themeClass = "card-noctis"; sigilClass = "sigil-noctis"; }
    
    // [FIX] Taboo Check
    if (card.isTaboo) {
        themeClass = "card-taboo";
        sigilClass = "sigil-taboo";
    }
    
    el.className = `card-visual ${themeClass}`;
    
    // [FIX] Type Mapping
    const rawType = (card.type || "").toLowerCase();
    let typeClass = 'type-spell'; 
    let typeLabel = "SPELL"; 
    
    if(rawType === 'vessel' || rawType === 'unit') { typeClass = 'type-unit'; typeLabel = "VESSEL"; }
    else if(rawType === 'ritual' || rawType === 'spell') { typeClass = 'type-spell'; typeLabel = "RITUAL"; }
    else if(rawType === 'sanctum' || rawType === 'building') { typeClass = 'type-building'; typeLabel = "SANCTUM"; }
    
    el.innerHTML = `
        <div class="card-roman-cost">${toRoman(card.cost)}</div>
        <div class="card-type-indicator ${typeClass}" title="${typeLabel}"></div>
        <div class="card-sigil ${sigilClass}"></div>
        <div class="card-name">${card.name}</div>
        <div style="position:absolute; bottom:2px; left:4px; font-size:6px; color:#888; text-transform:uppercase;">${typeLabel}</div>
    `;
    return el;
}

function toggleCardSelection(id) {
    if (selectedCards.has(id)) {
        selectedCards.delete(id);
    } else {
        if (selectedCards.size >= DECK_SIZE) {
            showToast(`Max ${DECK_SIZE} cards!`, "error");
            return;
        }
        
        // [NEW] Taboo Limit Check
        const card = CARDS[id];
        if (card.isTaboo) {
            let tabooCount = 0;
            selectedCards.forEach(cid => {
                if(CARDS[cid] && CARDS[cid].isTaboo) tabooCount++;
            });
            
            if (tabooCount >= 1) {
                showToast("Limit: 1 Taboo Card per Deck!", "error");
                return;
            }
        }
        
        selectedCards.add(id);
    }
    // Refresh Grid (for dimming) and Sidebar
    refreshCardGrid(currentDbFaction); // [FIX] Use stored faction
    updateDeckListUI();
}

function updateDeckListUI() {
    const list = document.getElementById("db-deck-list");
    const countVal = document.getElementById("db-count-val");
    if(!list) return;
    
    list.innerHTML = "";
    if(countVal) countVal.innerText = selectedCards.size;
    
    const btn = document.getElementById("btn-submit-deck");
    if(btn) {
        if(selectedCards.size === DECK_SIZE) {
            btn.classList.add("ready");
            btn.style.opacity = 1;
        } else {
            btn.classList.remove("ready");
            btn.style.opacity = 0.5;
        }
    }

    selectedCards.forEach(id => {
        const card = CARDS[id];
        if(!card) return;
        
        const item = document.createElement("div");
        const theme = card.minFaction === 'solaris' ? 'item-solaris' : (card.minFaction === 'noctis' ? 'item-noctis' : '');
        item.className = `db-deck-item ${theme}`;
        item.innerHTML = `<span>${card.name}</span><span>${toRoman(card.cost)}</span>`;
        item.onclick = () => toggleCardSelection(id);
        
        // Hover to preview?
        item.onmouseenter = () => { /* Optional: quick preview? */ };
        
        list.appendChild(item);
    });
}

function showCardDetail(card) {
    const overlay = document.getElementById("card-detail-overlay");
    if(!overlay) return;
    
    // Helper: Format Demerit
    let demeritHtml = "";
    if (card.isTaboo) {
        let demeritText = "Unknown Curse";
        if (card.demerit) {
            if (card.demerit.type === 'arcana_mult') demeritText = `Perm. Arcana Regen x${card.demerit.value}`;
            if (card.demerit.type === 'tower_damage_mult') demeritText = `Perm. Tower Dmg x${card.demerit.value}`;
        }
        demeritHtml = `<div class="detail-demerit">⚠️ TABOO: ${demeritText}</div>`;
    }
    
    // Helper: Count
    let countHtml = "";
    if (card.stats && card.stats.count > 1) {
        countHtml = `<div class="detail-badge">x${card.stats.count} Units</div>`;
    }
    
    // Helper: Friendly Fire Warning
    let ffHtml = "";
    if (card.stats && card.stats.targetTeam === 'all') {
        ffHtml = `<div class="detail-warning">⚔️ ATTACKS ALLIES</div>`;
    }
    
    overlay.innerHTML = `
        <div class="detail-card-view ${card.isTaboo ? 'border-taboo' : ''}">
            <button class="btn-close-detail" onclick="document.getElementById('card-detail-overlay').classList.remove('visible')">×</button>
            <div class="detail-header">
                <div class="detail-title">${card.name}</div>
                <div class="detail-cost">${toRoman(card.cost)}</div>
            </div>
            
            <div class="detail-type">
                <span>${card.type}</span>
                <span>•</span>
                <span>${card.minFaction.toUpperCase()}</span>
                ${countHtml}
            </div>
            
            ${demeritHtml}
            ${ffHtml}
            
            <div class="detail-stats">
                 ${card.stats && card.stats.hp ? `<div class="stat-row"><span class="stat-label">HP</span><span>${card.stats.hp}</span></div>` : ''}
                 ${card.stats && card.stats.damage ? `<div class="stat-row"><span class="stat-label">ATK</span><span>${card.stats.damage}</span></div>` : ''}
                 ${card.stats && card.stats.range ? `<div class="stat-row"><span class="stat-label">RNG</span><span>${card.stats.range}</span></div>` : ''}
            </div>
            
            <div class="detail-desc">
                "${card.description || "A mysterious power..."}"
            </div>
        </div>
    `;
    
    overlay.classList.add("visible");
    overlay.onclick = (e) => {
        if(e.target === overlay) overlay.classList.remove("visible");
    };
}

function submitDeck() {
    if (selectedCards.size !== DECK_SIZE) {
        showToast(`Select exactly ${DECK_SIZE} cards!`, "error");
        return;
    }
    
    isDeckSubmitted = true;
    _socket.emit("submit_deck", Array.from(selectedCards));
    renderWaitingScreen();
}

function renderWaitingScreen() {
    const db = document.getElementById("deck-builder");
    if (db) db.innerHTML = `<div style="height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; color:#fff;">
        <h2>DECK SUBMITTED</h2>
        <div class="db-lore" style="margin-top:10px;">Fate is being woven...</div>
    </div>`;
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
