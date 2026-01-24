
import { initSocket } from "./net/socket.js";
const socket = initSocket();

const lobbyScreen = document.getElementById("lobby-screen");
const gameViewport = document.getElementById("game-viewport");
const roomListContainer = document.getElementById("room-list-items");
const createRoomBtn = document.getElementById("btn-create-room");
const roomNameInput = document.getElementById("room-name-input");
const joinRoomBtn = document.getElementById("btn-join-room-id"); // Optional manual join
const refreshBtn = document.getElementById("btn-refresh-rooms");

export function initLobby() {
    console.log("Initializing Lobby...");
    
    // Show Lobby, Hide Game
    lobbyScreen.style.display = "flex";
    gameViewport.style.display = "none"; // Hide initially

    // Listeners
    createRoomBtn.addEventListener("click", () => {
        const name = roomNameInput.value.trim();
        socket.emit("lobby:create", name);
    });

    refreshBtn.addEventListener("click", () => {
        socket.emit("lobby:list");
    });

    // Socket Events
    socket.emit("lobby:list"); // Initial fetch

    socket.on("lobby:list", (rooms) => {
        renderRoomList(rooms);
    });

    socket.on("lobby:update", (rooms) => {
        renderRoomList(rooms);
    });

    // When we successfully join a room (welcome packet), switch view
    socket.on("welcome", (data) => {
        console.log("Joined Room:", data.roomId);
        lobbyScreen.style.display = "none";
        gameViewport.style.display = "block";
        
        // [FIX] Force Resize event agar Pixi tahu ukuran baru
        window.dispatchEvent(new Event('resize'));
        
        // Notify user about room
        const statusEl = document.getElementById("status");
        if (statusEl) statusEl.innerText = `Room: ${data.roomName}`;
    });
}

function renderRoomList(rooms) {
    roomListContainer.innerHTML = "";
    
    if (rooms.length === 0) {
        roomListContainer.innerHTML = "<div class='no-rooms'>No active arenas. Create one!</div>";
        return;
    }

    rooms.forEach(room => {
        const div = document.createElement("div");
        div.className = "room-item";
        
        const info = document.createElement("div");
        info.className = "room-info";
        // Phase nicely formatted
        let phaseText = room.phase;
        if(room.phase === 'deck_building') phaseText = "Formation";
        if(room.phase === 'preparation') phaseText = "Preparing";
        if(room.phase === 'battle') phaseText = "Battling";
        
        info.innerHTML = `<span class="room-name">${room.name}</span> <span class="room-stats">${room.players}/2 Players - ${phaseText}</span>`;
        
        const joinBtn = document.createElement("button");
        joinBtn.innerText = "BIND SOUL";
        joinBtn.className = "btn-join";
        
        if (room.players >= 2) {
             joinBtn.innerText = "OBSERVE";
             joinBtn.classList.add("btn-spectate");
             // btn-join is base class, just add spectate for variant
        }

        joinBtn.addEventListener("click", () => {
            socket.emit("lobby:join", room.id);
        });

        div.appendChild(info);
        div.appendChild(joinBtn);
        roomListContainer.appendChild(div);
    });
}
