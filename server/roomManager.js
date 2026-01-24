
import { Room } from "./room.js";

export class RoomManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map(); // roomId -> Room
        
        // Cleanup Interval (Check every 10 seconds)
        setInterval(() => {
            this.cleanup();
        }, 10000);
    }

    cleanup() {
        for (const [id, room] of this.rooms) {
            if (room.isEmpty) {
                console.log(`[RoomManager] Cleaning up empty room: ${id}`);
                room.destroy();
                this.rooms.delete(id);
            }
        }
    }

    createRoom(roomName) {
        const id = Math.random().toString(36).substring(2, 9); // Random ID
        const room = new Room(id, this.io, roomName);
        this.rooms.set(id, room);
        console.log(`[RoomManager] Created room ${id} (${roomName})`);
        return id;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    deleteRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.destroy();
            this.rooms.delete(roomId);
            console.log(`[RoomManager] Deleted room ${roomId}`);
        }
    }

    getRoomList() {
        const list = [];
        for (const [id, room] of this.rooms) {
            // Count players
            let players = 0;
            if (room.sessions[0]) players++;
            if (room.sessions[1]) players++;
            
            list.push({
                id: id,
                name: room.name,
                players: players,
                phase: room.gameState.phase
            });
        }
        return list;
    }
}
