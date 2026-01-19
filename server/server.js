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

const gameState = createGameState();
const TICK_RATE = 1000 / 30; // 30 ticks per second
const DT = TICK_RATE / 1000; // delta time in seconds

const sessions = {
  0: null, // Socket ID untuk Team 0
  1: null, // Socket ID untuk Team 1
};

setInterval(() => {
  if (gameState.phase === "ended") {
    // Kirim state terakhir sekali saja (atau handle reset logic nanti)
    // io.emit("state", gameState); // Opsional, biarkan client handle di UI
    return;
  }

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
      "vessel_01",
      "vessel_02",
      "ritual_01",
      "vessel_siege",
      "vessel_healer",
    ];
    playerState.deck.sort(() => Math.random() - 0.5);
  }
  if (playerState.next) {
    playerState.hand.push(playerState.next);
    playerState.next = playerState.deck.pop();
  }

  return true; // Sukses
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

  // 2. BERITAHU CLIENT DIA SIAPA
  // Kirim event khusus 'welcome'
  socket.emit("welcome", {
    myTeam: assignedTeam,
    initialState: gameState,
  });

  console.log(`Socket ${socket.id} assigned to Team ${assignedTeam}`);

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
      spawnUnit(gameState, {
        cardId: data.cardId,
        team: assignedTeam,
        col: data.col,
        row: data.row,
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
      });
    }
  });

  // === HANDLER 2: CAST RITUAL (Spell) ===
  socket.on("cast_ritual", (data) => {
    if (assignedTeam === -1) return;
    const playerState = gameState.players[assignedTeam];
    const cardInfo = CARDS[data.cardId];
    if (!cardInfo || cardInfo.type !== "RITUAL") return;

    // Validasi Placement Ritual?
    // Ritual biasanya BEBAS (bisa di mana saja), jadi kita SKIP isValidPlacement.
    // Atau buat validasi khusus (misal: hanya radius 5 dari unit teman).
    // Untuk "Solar Flare", kita biarkan bebas (Global Range).

    // Proses Pembayaran & Kartu
    if (processCardUsage(playerState, cardInfo, data.cardId)) {
      // Jika sukses bayar -> Cast Effect
      castRitual(gameState, {
        team: assignedTeam,
        col: data.col,
        row: data.row,
        spellData: cardInfo.spellData,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);

    // HAPUS DARI KURSI
    if (sessions[0] === socket.id) sessions[0] = null;
    if (sessions[1] === socket.id) sessions[1] = null;
  });
});

server.listen(8000, () => {
  console.log("Server running on port 8000");
});
