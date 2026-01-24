import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { RoomManager } from "./roomManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const roomManager = new RoomManager(io);

// Static Files
app.use(express.static(path.join(__dirname, "../client")));
app.use("/shared", express.static(path.join(__dirname, "../shared")));

// Mapping Socket -> Room ID & Team ID
const socketMap = new Map(); // socketId -> { roomId, teamId }

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // === LOBBY EVENTS ===

  // 1. List Rooms
  socket.on("lobby:list", () => {
      socket.emit("lobby:list", roomManager.getRoomList());
  });

  // 2. Create Room
  socket.on("lobby:create", (roomName) => {
      const name = roomName || `Arena ${Math.floor(Math.random() * 100)}`;
      const roomId = roomManager.createRoom(name);
      
      // Auto-join creator? Yes.
      joinRoom(socket, roomId);
      
      // Broadcast updated list to everyone in lobby?
      // Ideally we have a 'lobby' room, but for now just broadcast to all if needed,
      // or clients poll. Let's broadcast to all sockets not in a game?
      // Or just let clients refresh. For now simple response.
      io.emit("lobby:update", roomManager.getRoomList());
  });

  // 3. Join Room
  socket.on("lobby:join", (roomId) => {
      joinRoom(socket, roomId);
      io.emit("lobby:update", roomManager.getRoomList());
  });

  function joinRoom(socket, roomId) {
      const room = roomManager.getRoom(roomId);
      if (!room) {
          socket.emit("toast", { msg: "Room not found.", type: "error" });
          return;
      }

      const teamId = room.addPlayer(socket);
      
      // Verify if player actually got a seat (0 or 1), or is spectator (-1)
      // Room logic handles sending 'welcome' packet.
      
      socketMap.set(socket.id, { roomId, teamId });
      console.log(`Socket ${socket.id} joined Room ${roomId} as Team ${teamId}`);
  }

  // === GAME EVENTS (Delegated to Room) ===

  socket.on("submit_deck", (cardIds) => {
      const data = socketMap.get(socket.id);
      if (!data) return;
      const room = roomManager.getRoom(data.roomId);
      if (room) room.submitDeck(data.teamId, cardIds, socket);
  });

  socket.on("spawn_unit", (spawnData) => {
      const data = socketMap.get(socket.id);
      if (!data) return;
      const room = roomManager.getRoom(data.roomId);
      if (room) room.spawnUnit(data.teamId, spawnData, socket);
  });

  socket.on("cast_ritual", (ritualData) => {
      const data = socketMap.get(socket.id);
      if (!data) return;
      const room = roomManager.getRoom(data.roomId);
      if (room) room.castRitual(data.teamId, ritualData, socket);
  });

  socket.on("rematch_request", () => {
      const data = socketMap.get(socket.id);
      if (!data) return;
      const room = roomManager.getRoom(data.roomId);
      if (room) room.handleRematch(data.teamId);
  });

  socket.on("request_state", () => {
      const data = socketMap.get(socket.id);
      if (!data) return;
      const room = roomManager.getRoom(data.roomId);
      if (room) socket.emit("state", room.gameState);
  });

  // === DISCONNECT ===
  socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      const data = socketMap.get(socket.id);
      if (data) {
          const room = roomManager.getRoom(data.roomId);
          if (room) {
              room.removePlayer(socket, data.teamId);
              
              // If room empty, maybe delete it after some time?
              // For now keep it simple.
              setTimeout(() => {
                   const currRoom = roomManager.getRoom(data.roomId);
                   if (currRoom) {
                       // Simple garbage collection: if both null, delete?
                       // Or if empty for X minutes.
                       // Left as future improvement.
                       if (!currRoom.sessions[0] && !currRoom.sessions[1]) {
                           // roomManager.deleteRoom(data.roomId); 
                       }
                   }
              }, 5000);
          }
          socketMap.delete(socket.id);
          io.emit("lobby:update", roomManager.getRoomList());
      }
  });
});

server.listen(8000, () => {
  console.log("Server running on port 8000");
});
