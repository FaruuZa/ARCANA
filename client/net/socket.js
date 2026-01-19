import { gameState } from "../state/gameState.js";

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
    gameState.set(data);

    // LOGIC GAME OVER CLIENT SIDE
    if (data.phase === "ended" && !hasShownGameOver) {
        hasShownGameOver = true;
        
        // Asumsi kita Player 0
        const myTeam = 0; 
        const isWinner = data.winner === myTeam;
        
        if (isWinner) {
            alert("VICTORY! The enemy King has fallen!");
        } else {
            alert("DEFEAT! Your King has fallen!");
        }
        
        // Nanti bisa diganti dengan Overlay HTML yang cantik
    }
  });

  return socket;
}
