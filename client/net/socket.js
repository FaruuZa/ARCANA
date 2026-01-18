import { gameState } from "../state/gameState.js";

let socket = null;

export function initSocket() {
  if (socket) return socket;

  socket = io();

  socket.on("connect", () => {
    console.log("SOCKET CONNECTED");
  });

  socket.emit("request_state");

  socket.on("state", (data) => {
    console.log("STATE RECEIVED", data);
    gameState.set(data);
  });

  return socket;
}
