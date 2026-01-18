import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createGameState } from "./gameState.js";
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

gameState.units.push({
  id: 1,
  team: 0,
  type: "melee",
  lane: 0,
  rowProgress: 0.2,
  offsetX : 0,
  offsetY: 0,
  speed: 0.05,
  range: 0.35,
  hp: 100,
  attackTimer: 0,
  attackCooldown: 1,
  damage: 10
});


app.use(express.static(path.join(__dirname, "../client")));

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
