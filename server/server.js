import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createGameState } from "./gameState.js";
import { startGameLoop } from "./gameLoop.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const gameState = createGameState();

startGameLoop(gameState, io);

gameState.units.push({
  id: 1,
  team: 0,
  lane: 0,
  progress: 0.2,
  offsetX: 0,
  offsetY: 0,

  speed:0.05,
  hp: 100
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


server.listen(3000, () => {
  console.log("Server running on port 3000");
});
