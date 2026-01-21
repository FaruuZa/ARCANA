import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createGameState, spawnUnit } from "./gameState.js";
import { gameLoop } from "./gameLoop.js";
import { CARDS } from "../shared/data/cards.js";
import { isValidPlacement } from "./rules/placement.js";
import { castRitual } from "./systems/spellSystem.js";
import { processDeaths } from "./systems/deathSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let gameState = createGameState();
const TICK_RATE = 1000 / 30; // 30 ticks per second
const DT = TICK_RATE / 1000; // delta time in seconds

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

  if (!gameState.paused && gameState.phase === "battle") {
    gameLoop(gameState, DT);
    processDeaths(gameState);
  }

  const packet = {
    ...gameState, // Copy data game
    timestamp: Date.now(),
  };

  io.emit("state", packet);
}, TICK_RATE);

app.use(express.static(path.join(__dirname, "../client")));
app.use("/shared", express.static(path.join(__dirname, "../shared")));

function processCardUsage(playerState, cardInfo, cardId) {
  const cardIndex = playerState.hand.indexOf(cardId);
  if (cardIndex === -1) return false; // Kartu gak ada di tangan (Cheat?)

  if (playerState.arcana < cardInfo.cost) return false; // Duit gak cukup

  // 1. Bayar
  playerState.arcana -= cardInfo.cost;

  // 2. Buang Kartu
  playerState.hand.splice(cardIndex, 1);

  // 3. Tarik Kartu Baru
  if (playerState.deck.length === 0) {
    // Refill deck (Logic sederhana)
    playerState.deck = [
      "vessel_cavalry", 'vessel_assassin', 'vessel_silencer', 'ritual_root', 'ritual_warcry', 'vessel_frost_archer', 'vessel_hammer'
    ];
    playerState.deck.sort(() => Math.random() - 0.5);
  }
  if (playerState.next) {
    playerState.hand.push(playerState.next);
    playerState.next = playerState.deck.pop();
  }

  return true; // Sukses
}

function getRandomOffset(radius) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * radius; // Uniform distribution
    return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist
    };
}

io.on("connection", (socket) => {
  console.log("client connected");

  let assignedTeam = -1;

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

  // === LOGIKA SPAWN YANG AMAN ===
  socket.on("spawn_unit", (data) => {
    if (assignedTeam === -1) return;
    const playerState = gameState.players[assignedTeam];
    const cardInfo = CARDS[data.cardId];
    if (!cardInfo) return;

    // Validasi Placement Unit (Tidak boleh di sungai/musuh)
    if (!isValidPlacement(assignedTeam, data.col, data.row)) return;

    // Proses Pembayaran & Kartu
    if (processCardUsage(playerState, cardInfo, data.cardId)) {
      // Jika sukses bayar -> Spawn Entity

      const count = cardInfo.stats.count || 1;
      const spawnRadius = cardInfo.stats.spawnRadius || 0.5;
      for (let i = 0; i < count; i++) {
        let finalCol = data.col;
        let finalRow = data.row;

        // Jika Swarm, beri offset sedikit
        if (count > 1) {
          const offset = getRandomOffset(spawnRadius);
          finalCol += offset.x;
          finalRow += offset.y;

          // Clamp biar gak keluar map
          finalCol = Math.max(1, Math.min(17, finalCol));
          // (Row clamp tergantung team, tapi logic spawnUnit di gameState biasanya handle clamp basic)
        }
        spawnUnit(gameState, {
          cardId: data.cardId,
          team: assignedTeam,
          col: finalCol,
          row: finalRow,
          // Stats Unit...
          hp: cardInfo.stats.hp,
          damage: cardInfo.stats.damage,
          range: cardInfo.stats.range,
          sightRange: cardInfo.stats.sightRange,
          speed: cardInfo.stats.speed,
          attackSpeed: cardInfo.stats.attackSpeed,
          deployTime: cardInfo.stats.deployTime,
          aimTime: cardInfo.stats.aimTime,
          movementType: cardInfo.stats.movementType,
          targetTeam: cardInfo.stats.targetTeam,
          targetRule: cardInfo.stats.targetRule,
          targetHeight: cardInfo.stats.targetHeight,
          aoeRadius: cardInfo.stats.aoeRadius || 0,
          aoeType: cardInfo.stats.aoeType || 'target',
          projectileType: cardInfo.stats.projectileType || null,
          count: count,
          spawnRadius: spawnRadius,
          traits: cardInfo.stats.traits || {},
        });
      }
    }
  });

  // === HANDLER 2: CAST RITUAL (Spell) ===
  socket.on("cast_ritual", (data) => {
    // 1. Validasi State
    if (gameState.phase !== "battle") return;
    if (assignedTeam === -1) return;

    // 2. Validasi Data Kartu
    const player = gameState.players[assignedTeam];
    const cardId = data.cardId;
    const cardData = CARDS[cardId];

    if (!cardData || cardData.type !== "RITUAL") return;

    // 3. Validasi Cost & Cooldown (Basic)
    if (player.arcana < cardData.cost) return;

    // 4. Potong Mana & Putar Deck
    player.arcana -= cardData.cost;
    
    // Logic putar kartu (Next -> Hand -> Deck)
    const handIndex = player.hand.indexOf(cardId);
    if (handIndex !== -1) {
        player.hand[handIndex] = player.next;
        player.next = player.deck.shift();
        player.deck.push(cardId); 
    }

    // 5. [FIX] DELEGASIKAN LOGIKA GAME KE SYSTEM
    castRitual(
        gameState, 
        socket.id, 
        assignedTeam, 
        cardId, 
        { col: data.col, row: data.row } // Target Pos
    );
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
            gameState.players[0].faction = 'noctis';
            gameState.players[1].faction = 'solaris';
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
