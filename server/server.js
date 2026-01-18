import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createGameState, spawnUnit } from "./gameState.js";
import { gameLoop } from "./gameLoop.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const gameState = createGameState();
const TICK_RATE = 1000 / 30; // 30 ticks per second
const DT = TICK_RATE / 1000; // delta time in seconds

setInterval(() => {
  gameLoop(gameState, DT);
  io.emit("state", gameState);
}, TICK_RATE);

spawnUnit(gameState, {
  cardId: "vessel_01", // ID sembarang dulu
  team: 0,             // Player Bawah
  lane: 0,             // Lane Tengah
  speed: 4,          // Speed standar
  hp: 100,
  range:2.0,
  damage: 25
});
spawnUnit(gameState, {
  cardId: "vessel_01", // ID sembarang dulu
  team: 1,             // Player Atas
  lane: 0,             // Lane Tengah
  speed: 4,          // Speed standar
  hp: 100,
  range:7.0,
  damage: 25
});



app.use(express.static(path.join(__dirname, "../client")));
app.use("/shared", express.static(path.join(__dirname, "../shared")));

io.on("connection", socket => {
  console.log("client connected");

  socket.emit("state:update", gameState);

  socket.on("request_state", () => {
    socket.emit("state", gameState);
  });
  
  socket.on("disconnect", () => {
    console.log("client disconnected");
  });
});


server.listen(8000, () => {
  console.log("Server running on port 8000");
});
