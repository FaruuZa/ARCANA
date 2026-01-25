import { gameState, onStateUpdate } from "../state/gameState.js";

let socket = null;
let hasShownGameOver = false; // Flag biar alert gak muncul berkali-kali

export function initSocket() {
  if (socket) return socket;

  socket = io();

  socket.on("connect", () => {
    console.log("SOCKET CONNECTED");
  });

  socket.emit("request_state");

  socket.on("welcome", (data) => {
    console.log("Joined as Team:", data.myTeam);

    // 1. Simpan Identitas
    gameState.setMyTeam(data.myTeam);

    // 2. Set State Awal
    gameState.set(data.initialState);
  });

  socket.on("state", (data) => {
    onStateUpdate(data);
  });

  return socket;
}

export function getSocket() {
  return socket;
}
