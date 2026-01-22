import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createGameState, createRandomDeck } from "./gameState.js";
import { gameLoop } from "./gameLoop.js";
import { playUnitCard, playSpellCard } from "./systems/cardSystem.js";
import { DECK_SIZE, HAND_SIZE, MAX_TABOO_CARDS} from "../shared/constants.js"; // Note: CARDS in constants or data? 
import { CARDS } from "../shared/data/cards.js"; // Import CARDS data


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let gameState = createGameState();
const FPS = 30; 
const TICK_RATE = 1000 / FPS; // MS per tick (33.33ms)
const DT = 1 / FPS; // Delta Time in Seconds (0.033s)
// Helper: Start Battle

import { rollOmen } from "./systems/omenSystem.js"; // [NEW]

function startBattle(gameState) {
    if (gameState.phase === 'battle') return;

    console.log("Starting Battle!");
    gameState.phase = 'battle';
    gameState.prepEndTime = null; 
    
    // Drop the Curtain event
    io.emit("curtain_drop");

    // [NEW] Roll Omen
    const omen = rollOmen(gameState);
    
    // [NEW] Omen Announcement & Delay
    // We want to show Omen BEFORE actual combat starts? 
    // "curtain menurun -> muncul announcement -> game mulai"
    // So maybe we shouldn't set phase='battle' immediately for logic ticks?
    // But 'battle' phase enables gameLoop.
    // Let's keep it simple: Game starts, updates run, but we show overlay.
    // Or we can add a brief 'cinematic' phase?
    // Request: "setelah beberapa saat announcement hilang -> game selesai" (No, game continues)
    // "muncul announcement... agar terasa mencekam... setelah beberapa saat hilang"
    
    if (omen) {
        console.log(`[OMEN] Effect Triggered: ${omen.name}`);
        // Emit specialized event for Overlay
        io.emit("omen_announcement", { 
            name: omen.name, 
            description: omen.description,
            type: "major" // for styling
        });
    } else {
        console.log("[OMEN] No effect this battle.");
        // Optional: Emit distinct "No Omen" or just silence?
        // Maybe "The Veil is Silent"
        io.emit("omen_announcement", {
            name: "The Void",
            description: "No Omen appears this night.",
            type: "minor"
        });
    }

    // Initialize Hands for everyone
    [0, 1].forEach(teamId => {
        const player = gameState.players[teamId];
        
        // Final Auto-Fill (safety)
        if (player.deck.length !== DECK_SIZE) {
            player.deck = createRandomDeck(player.faction);
        }

        // Draw Initial Hand (Random 5)
        player.hand = [];
        for (let i = 0; i < HAND_SIZE; i++) {
            const randomCardId = player.deck[Math.floor(Math.random() * player.deck.length)];
            player.hand.push(randomCardId);
        }
        player.next = player.deck[Math.floor(Math.random() * player.deck.length)];
    });

    io.emit("toast", { msg: "Battle Started!", type: "success" });
    io.emit("state", gameState); // Sync full state
}

const sessions = {
  0: null, // Socket ID untuk Team 0
  1: null, // Socket ID untuk Team 1
};

const disconnectTimers = {
  0: null,
  1: null
};

const PAUSE_DURATION_MS = 60000; // 1 Menit

let rematchVotes = new Set();

setInterval(() => {
    // [NEW] PREPARATION TIMER LOGIC
    if (!gameState.paused && gameState.phase === "preparation") {
        if (Date.now() > gameState.prepEndTime) {
            console.log("Preparation Time Limit Reached!");
            startBattle(gameState);
        }
    }

    if (!gameState.paused && gameState.phase === "battle") {
        gameLoop(gameState, DT);
    }

  const packet = {
    ...gameState, // Copy data game
    timestamp: Date.now(),
  };

  io.emit("state", packet);
}, TICK_RATE);

// ...



  // ... (Other handlers)


app.use(express.static(path.join(__dirname, "../client")));
app.use("/shared", express.static(path.join(__dirname, "../shared")));



io.on("connection", (socket) => {
  console.log("client connected", socket.id);

  // === [FIX] SPECTATOR BUG ===
  // Cek apakah slot yang "terisi" sebenarnya hantu (socket sudah tidak ada / disconnected)?
  // Ini penting jika server tidak men-detect disconnect dengan benar sebelumnya,
  // atau user me-refresh page dengan cepat.

  for (let i = 0; i < 2; i++) {
      if (sessions[i] !== null) {
          // Verify if this socket ID is still valid in Socket.IO manager
          const existingSocket = io.sockets.sockets.get(sessions[i]);
          if (!existingSocket) {
              console.log(`[CleanUp] Found stale session for Team ${i} (ID: ${sessions[i]}). Clearing slot.`);
              sessions[i] = null;
              if (gameState.players[i]) gameState.players[i].connected = false;
          }
      }
  }

  let assignedTeam = -1;
  // Cari Slot Kosong
  if (sessions[0] === null) {
    sessions[0] = socket.id;
    assignedTeam = 0;
  } else if (sessions[1] === null) {
    sessions[1] = socket.id;
    assignedTeam = 1;
  }

  // Set status Connected di State
  if (assignedTeam !== -1) {
      gameState.players[assignedTeam].connected = true;

      handlePlayerConnect(assignedTeam);
      io.emit("toast", { msg: `Player joined Team ${assignedTeam == 0 ? "Solaris" : "Noctis"}`, type: "success" });
  } else {
      // Spectator
      socket.emit("toast", { msg: "Room full. Spectating mode.", type: "info" });
  }

  // 2. BERITAHU CLIENT DIA SIAPA
  socket.emit("welcome", {
    myTeam: assignedTeam,
    initialState: gameState,
  });

  console.log(`Socket ${socket.id} assigned to Team ${assignedTeam}`);

  socket.on("request_join_game", (teamId) => {
      if (sessions[teamId] === null) {
          sessions[teamId] = socket.id;
          assignedTeam = teamId;
          gameState.players[teamId].connected = true;

          // [NEW] Handle Reconnect (Cancel Timer)
          handlePlayerConnect(teamId);

          socket.emit("welcome", {
              myTeam: assignedTeam,
              initialState: gameState
          });

          io.emit("toast", { msg: `A Spectator took over Team ${teamId == 0 ? "Solaris" : "Noctis"}!`, type: "success" });
      } else {
          socket.emit("toast", { msg: "Slot already taken!", type: "error" });
      }
  });

  socket.emit("state:update", gameState); // Kirim state awal penuh

  socket.on("request_state", () => {
    socket.emit("state", gameState);
  });

  // [NEW] SUBMIT DECK HANDLER
  socket.on("submit_deck", (cardIds) => {
      console.log(`Player ${assignedTeam} submitting deck:`, cardIds);
      if (assignedTeam === -1) return;
      if (gameState.phase !== 'preparation' && gameState.phase !== 'deck_building') return;

      const player = gameState.players[assignedTeam];
      if (player.ready) return; // Already ready

      // 1. Validate Deck Size
      if (!Array.isArray(cardIds) || cardIds.length !== DECK_SIZE) {
          socket.emit("toast", { msg: `Deck must have exactly ${DECK_SIZE} cards!`, type: "error" });
          return;
      }

      // 2. Validate Cards
      let tabooCount = 0;
      for (const id of cardIds) {
          const cardData = CARDS[id];
          if (!cardData) {
               socket.emit("toast", { msg: `Invalid card ID: ${id}`, type: "error" });
               return;
          }

          // Faction Check
          if (cardData.minFaction !== 'neutral' && cardData.minFaction !== player.faction) {
              socket.emit("toast", { msg: `Card ${cardData.name} belongs to ${cardData.minFaction}!`, type: "error" });
              return;
          }

          // Taboo Check
          if (cardData.isTaboo) {
              tabooCount++;
          }
      }

      if (tabooCount > MAX_TABOO_CARDS) {
          socket.emit("toast", { msg: `Max ${MAX_TABOO_CARDS} Taboo card allowed!`, type: "error" });
          return;
      }

      // 3. Save Deck
      player.deck = cardIds;
      player.ready = true;
      socket.emit("toast", { msg: "Deck Validated! Waiting for opponent...", type: "success" });

      // 4. Check Start
      const p0 = gameState.players[0];
      const p1 = gameState.players[1];
      if (p0.ready && p1.ready) {
          startBattle(gameState);
      }
  });

  // === LOGIKA SPAWN YANG AMAN ===
  socket.on("spawn_unit", (data) => {
    if (assignedTeam === -1) return;
    
    // [REFACTOR] Delegate to cardSystem
    const success = playUnitCard(gameState, assignedTeam, data.cardId, data.col, data.row);
    
    if (!success) {
        // Optional: Send error feedback to client
        // socket.emit("error", "Invalid spawn");
    }
  });

  // === HANDLER 2: CAST RITUAL (Spell) ===
  socket.on("cast_ritual", (data) => {
    // 1. Validasi State
    if (gameState.phase !== "battle") return;
    if (assignedTeam === -1) return;

    // [REFACTOR] Delegate to cardSystem
    playSpellCard(gameState, socket.id, assignedTeam, data.cardId, data.col, data.row);
  });

  socket.on("rematch_request", () => {
    // ... (Logic Rematch SAMA, tapi tambahkan reset Paused) ...
    if (gameState.phase !== "ended") return;
    if (assignedTeam === -1) return;

    rematchVotes.add(assignedTeam);
    gameState.rematchCount = rematchVotes.size;

    if (rematchVotes.has(0) && rematchVotes.has(1)) {
        console.log("BOTH PLAYERS READY -> RESET GAME");
        gameState = createGameState(); 
        
        // Pastikan Pause Reset
        gameState.paused = false;
        gameState.pauseEndTime = null;

        if (Math.random() > 0.5) {
             // Optional: Force swap? 
             // createGameState is random, so 50% chance to be same or swap.
             // If we want FORCE SWAP, we need to inspect the new state.
             // But 'random' is fine for now as per "random faction" rule.
        }
        rematchVotes.clear();
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Cek Team 0
    if (sessions[0] === socket.id) {
        sessions[0] = null;
        gameState.players[0].connected = false; 
        
        io.emit("toast", { msg: "Player Solaris Disconnected! Game Paused.", type: "error" });
        
        // [NEW] Trigger Pause Logic
        handlePlayerDisconnect(0);

        if (rematchVotes.has(0)) { rematchVotes.delete(0); gameState.rematchCount = rematchVotes.size; }
    }

    // Cek Team 1
    if (sessions[1] === socket.id) {
        sessions[1] = null;
        gameState.players[1].connected = false;

        io.emit("toast", { msg: "Player Noctis Disconnected! Game Paused.", type: "error" });

        // [NEW] Trigger Pause Logic
        handlePlayerDisconnect(1);

        if (rematchVotes.has(1)) { rematchVotes.delete(1); gameState.rematchCount = rematchVotes.size; }
    }
  });
});

function handlePlayerDisconnect(teamId) {
    if (gameState.phase !== 'battle') return; // Kalau game belum mulai/sudah kelar, abaikan

    // 1. Set State Paused
    gameState.paused = true;
    gameState.disconnectedTeam = teamId;
    gameState.pauseReason = `Waiting for Player ${teamId === 0 ? "Solaris" : "Noctis"}...`;
    gameState.pauseEndTime = Date.now() + PAUSE_DURATION_MS;

    // 2. Bersihkan timer lama jika ada (double safety)
    if (disconnectTimers[teamId]) clearTimeout(disconnectTimers[teamId]);

    // 3. Mulai Timer 1 Menit
    console.log(`Team ${teamId} disconnected. Pausing for 60s.`);
    
    disconnectTimers[teamId] = setTimeout(() => {
        // JIKA WAKTU HABIS DAN MASIH KOSONG:
        if (sessions[teamId] === null) {
            console.log(`Team ${teamId} timed out. Forfeit.`);
            
            gameState.paused = false;
            gameState.phase = "ended";
            gameState.pauseEndTime = null;
            
            // Lawan Menang
            gameState.winner = (teamId === 0) ? 1 : 0;
            
            io.emit("toast", { 
                msg: `Player ${teamId === 0 ? "Solaris" : "Noctis"} timed out! Opponent wins!`, 
                type: "info" 
            });
        }
    }, PAUSE_DURATION_MS);
}

function handlePlayerConnect(teamId) {
    // 1. Matikan Timer jika ada
    if (disconnectTimers[teamId]) {
        clearTimeout(disconnectTimers[teamId]);
        disconnectTimers[teamId] = null;
    }

    // 2. Cek apakah game bisa dilanjutkan?
    // Game lanjut jika KEDUA kursi terisi
    if (sessions[0] !== null && sessions[1] !== null) {
        if (gameState.paused) {
            console.log("Both players present. Resuming game.");
            gameState.paused = false;
            gameState.pauseEndTime = null;
            gameState.pauseReason = null;
            gameState.disconnectedTeam = -1;
            
            io.emit("toast", { msg: "Game Resumed!", type: "success" });
        }
    }
}

server.listen(8000, () => {
  console.log("Server running on port 8000");
});
