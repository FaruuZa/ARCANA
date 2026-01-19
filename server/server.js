import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createGameState, spawnUnit } from "./gameState.js";
import { gameLoop } from "./gameLoop.js";
import { CARDS } from "../shared/data/cards.js";
import { isValidPlacement } from "./rules/placement.js";

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
  1: null  // Socket ID untuk Team 1
};

setInterval(() => {

  if (gameState.phase === "ended") {
      // Kirim state terakhir sekali saja (atau handle reset logic nanti)
      // io.emit("state", gameState); // Opsional, biarkan client handle di UI
      return; 
  }

  gameLoop(gameState, DT);
  io.emit("state", gameState);
}, TICK_RATE);

app.use(express.static(path.join(__dirname, "../client")));
app.use("/shared", express.static(path.join(__dirname, "../shared")));

io.on("connection", socket => {
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
    initialState: gameState
  });

  console.log(`Socket ${socket.id} assigned to Team ${assignedTeam}`);

  socket.emit("state:update", gameState); // Kirim state awal penuh

  socket.on("request_state", () => {
    socket.emit("state", gameState);
  });
  
  // === LOGIKA SPAWN YANG AMAN ===
  socket.on("spawn_unit", (data) => {
    
    if (assignedTeam === -1) return;

    const playerTeam = assignedTeam;
    const playerState = gameState.players[playerTeam];

    // 1. Validasi Data Kartu
    const cardInfo = CARDS[data.cardId];
    if (!cardInfo) return;

    // 2. Validasi Hand
    if (!playerState.hand) return;
    const cardIndex = playerState.hand.indexOf(data.cardId);
    if (cardIndex === -1) {
        console.log("Cheating: Card not in hand!");
        return;
    }

    // 3. === VALIDASI PLACEMENT (BARU) ===
    // Menggunakan rules/placement.js
    if (!isValidPlacement(playerTeam, data.col, data.row)) {
        console.log(`❌ Invalid Spawn Position [${data.col}, ${data.row}] for Team ${playerTeam}`);
        return; // Batalkan spawn tanpa memotong Arcana
    }

    // 4. Validasi Arcana
    if (playerState.arcana < cardInfo.cost) {
        console.log("Not enough Arcana!");
        return;
    }

    // === EKSEKUSI ===
    console.log(`✅ Spawn Valid: ${data.cardId} at [${data.col}, ${data.row}]`);
    
    playerState.arcana -= cardInfo.cost;
    playerState.hand.splice(cardIndex, 1);

    // Rotasi Deck
    if (playerState.deck.length === 0) {
        playerState.deck = ["vessel_01", "vessel_02", "vessel_01", "vessel_02"];
        playerState.deck.sort(() => Math.random() - 0.5);
    }
    if (playerState.next) {
        playerState.hand.push(playerState.next);
        playerState.next = playerState.deck.pop();
    }

    spawnUnit(gameState, {
        cardId: data.cardId,
        team: playerTeam,
        col: data.col,
        row: data.row,
        hp: cardInfo.stats.hp,
        damage: cardInfo.stats.damage,
        range: cardInfo.stats.range,
        speed: cardInfo.stats.speed,
        attackSpeed: cardInfo.stats.attackSpeed
    });
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
