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

let rematchVotes = new Set();

setInterval(() => {

  gameLoop(gameState, DT);

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
      // [TOAST] Beritahu semua orang ada player masuk
      io.emit("toast", { msg: `Player joined Team ${assignedTeam == 0 ? "Solaris" : "Noctis"}`, type: "success" });
  } else {
      // Spectator
      socket.emit("toast", { msg: "Room full. Spectating mode.", type: "info" });
  }

  // 2. BERITAHU CLIENT DIA SIAPA
  // Kirim event khusus 'welcome'
  socket.emit("welcome", {
    myTeam: assignedTeam,
    initialState: gameState,
  });

  console.log(`Socket ${socket.id} assigned to Team ${assignedTeam}`);

  // [NEW] Handler Spectator ingin Join (Menggantikan yg DC)
  socket.on("request_join_game", (teamId) => {
      // Cek apakah kursi benar-benar kosong
      if (sessions[teamId] === null) {
          // Ambil alih kursi
          sessions[teamId] = socket.id;
          assignedTeam = teamId; // Update local scope variable
          gameState.players[teamId].connected = true;

          // Update Client ini: "Kamu sekarang main!"
          socket.emit("welcome", {
              myTeam: assignedTeam,
              initialState: gameState
          });

          // Beritahu semua orang
          io.emit("toast", { msg: `A Spectator took over Team ${teamId == 0 ? "Solaris" : "Noctis"}!`, type: "success" });
          
          console.log(`Socket ${socket.id} took over Team ${teamId}`);
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
    // 1. Validasi: Hanya boleh saat game selesai
    if (gameState.phase !== "ended") return;
    if (assignedTeam === -1) return;

    // 2. Catat Vote
    rematchVotes.add(assignedTeam);
    
    // 3. Update State untuk Client (Visual "1/2 Players")
    gameState.rematchCount = rematchVotes.size;

    // 4. Cek apakah kedua player sudah setuju?
    if (rematchVotes.has(0) && rematchVotes.has(1)) {
        console.log("BOTH PLAYERS READY -> RESET GAME");
        
        // A. RESET STATE TOTAL
        gameState = createGameState(); 

        // B. ACAK FACTION (Opsional: Tukar Faction Team 0 dan 1)
        // Secara default createGameState kasih Team 0 Solaris.
        // Kita acak 50/50:
        if (Math.random() > 0.5) {
            gameState.players[0].faction = 'noctis';
            gameState.players[1].faction = 'solaris';
        }

        // C. RESET VOTES
        rematchVotes.clear();
        
        // State baru (Phase: 'battle', Tick: 0) akan terkirim otomatis
        // di tick gameLoop berikutnya.
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    if (sessions[0] === socket.id) {
        sessions[0] = null;
        gameState.players[0].connected = false; // Tandai disconnected
        
        // [TOAST] Player Solaris keluar
        io.emit("toast", { msg: "Player Solaris (Blue) Disconnected!", type: "error" });
        
        // Reset rematch vote jika dia keluar
        if (rematchVotes.has(0)) { rematchVotes.delete(0); gameState.rematchCount = rematchVotes.size; }
    }

    if (sessions[1] === socket.id) {
        sessions[1] = null;
        gameState.players[1].connected = false; // Tandai disconnected

        // [TOAST] Player Noctis keluar
        io.emit("toast", { msg: "Player Noctis (Red) Disconnected!", type: "error" });

        if (rematchVotes.has(1)) { rematchVotes.delete(1); gameState.rematchCount = rematchVotes.size; }
    }
  });
});

server.listen(8000, () => {
  console.log("Server running on port 8000");
});
