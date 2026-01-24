
import { createGameState, createRandomDeck, spawnUnit } from "./gameState.js";
import { gameLoop } from "./gameLoop.js";
import { playUnitCard, playSpellCard, playSanctumCard } from "./systems/cardSystem.js";
import { rollOmen } from "./systems/omenSystem.js";
import { DECK_SIZE, HAND_SIZE, MAX_TABOO_CARDS } from "../shared/constants.js";
import { CARDS } from "../shared/data/cards.js";

const FPS = 30;
const TICK_RATE = 1000 / FPS;
const DT = 1 / FPS;
const PAUSE_DURATION_MS = 60000;

export class Room {
    constructor(roomId, io, roomName) {
        this.roomId = roomId;
        this.io = io;
        this.name = roomName || `Room ${roomId}`;
        
        this.gameState = createGameState();
        this.sessions = { 0: null, 1: null }; // teamId -> socketId
        this.disconnectTimers = { 0: null, 1: null };
        this.rematchVotes = new Set();
        
        this.intervalId = null;
        this.started = false;

        // Bind update loop
        this.startGameLoop();
    }

    startGameLoop() {
        this.intervalId = setInterval(() => {
            // Logic Update
            if (!this.gameState.paused && this.gameState.phase === "preparation") {
                if (Date.now() > this.gameState.prepEndTime) {
                    this.startBattle();
                }
            }

            if (!this.gameState.paused && this.gameState.phase === "battle") {
                gameLoop(this.gameState, DT);
            }

            // Broadcast State (Room specific)
            const packet = {
                ...this.gameState,
                timestamp: Date.now()
            };
            this.io.to(this.roomId).emit("state", packet);

        }, TICK_RATE);
    }

    // === LOBBY / CONNECTION LOGIC ===

    addPlayer(socket) {
        // Find empty slot
        let assignedTeam = -1;
        if (this.sessions[0] === null) {
            this.sessions[0] = socket.id;
            assignedTeam = 0;
        } else if (this.sessions[1] === null) {
            this.sessions[1] = socket.id;
            assignedTeam = 1;
        }

        // Join Socket.IO Room
        socket.join(this.roomId);

        if (assignedTeam !== -1) {
            this.gameState.players[assignedTeam].connected = true;
            this.handlePlayerConnect(assignedTeam);
            this.io.to(this.roomId).emit("toast", { msg: `A new fate has bound to ${this.getFactionLoreName(assignedTeam)}`, type: "success" });
        } else {
            socket.emit("toast", { msg: "The realm is full. You observe from the Void.", type: "info" });
        }

        // Welcome Packet
        socket.emit("welcome", {
            myTeam: assignedTeam,
            initialState: this.gameState,
            roomId: this.roomId,
            roomName: this.name
        });
        
        return assignedTeam;
    }

    removePlayer(socket, teamId) {
        // Handle Disconnect logic
        if (teamId === 0 || teamId === 1) {
            if (this.sessions[teamId] === socket.id) {
                this.sessions[teamId] = null;
                this.gameState.players[teamId].connected = false;
                
                const loreName = this.getFactionLoreName(teamId);
                this.io.to(this.roomId).emit("toast", { msg: `${loreName} has severed the connection! Time freezes.`, type: "error" });
                
                this.handlePlayerDisconnect(teamId);

                if (this.rematchVotes.has(teamId)) {
                    this.rematchVotes.delete(teamId);
                    this.gameState.rematchCount = this.rematchVotes.size;
                }
                
                // [NEW] Check Empty Room logic handled by RoomManager or here?
                // If both sessions are null, we can mark room as empty?
                // But we have a pause/reconnect window. 
                // If BOTH are gone, maybe close immediately?
                if (this.sessions[0] === null && this.sessions[1] === null) {
                    // Force End Game? Or just let timers run out?
                    // User request: "ketika tidak ada leader lagi maka room ditutup"
                    // If room is empty, we should probably close it to save resources
                    // But maybe allow short reconnect?
                    // Let's rely on RoomManager or just set a flag.
                    this.isEmpty = true; 
                }
            }
        }
    }

    handlePlayerDisconnect(teamId) {
        if (this.gameState.phase !== 'battle') return; 

        const loreName = this.getFactionLoreName(teamId);

        this.gameState.paused = true;
        this.gameState.disconnectedTeam = teamId;
        this.gameState.pauseReason = `Waiting for ${loreName} to reconnect...`;
        this.gameState.pauseEndTime = Date.now() + PAUSE_DURATION_MS;

        if (this.disconnectTimers[teamId]) clearTimeout(this.disconnectTimers[teamId]);

        this.disconnectTimers[teamId] = setTimeout(() => {
            if (this.sessions[teamId] === null) {
                this.gameState.paused = false;
                this.gameState.phase = "ended";
                this.gameState.pauseEndTime = null;
                this.gameState.winner = (teamId === 0) ? 1 : 0;
                
                this.io.to(this.roomId).emit("toast", { 
                    msg: `${loreName} has abandoned the timeline. Opponent wins by default.`, 
                    type: "info" 
                });
            }
        }, PAUSE_DURATION_MS);
    }

    handlePlayerConnect(teamId) {
        if (this.disconnectTimers[teamId]) {
            clearTimeout(this.disconnectTimers[teamId]);
            this.disconnectTimers[teamId] = null;
        }

        if (this.sessions[0] !== null && this.sessions[1] !== null) {
            if (this.gameState.paused) {
                this.gameState.paused = false;
                this.gameState.pauseEndTime = null;
                this.gameState.pauseReason = null;
                this.gameState.disconnectedTeam = -1;
                this.io.to(this.roomId).emit("toast", { msg: "The timelines converge once more. Battle Resumed!", type: "success" });
            }
        }
    }

    // === GAME LOGIC ===

    startBattle() {
        if (this.gameState.phase === 'battle') return;
        
        // CHECK: Both players must be ready (handled by submit_deck checks mostly, but double check)
        const p0 = this.gameState.players[0];
        const p1 = this.gameState.players[1];
        
        // Critical: Only start if both are ready OR if prep timer ended and we force them?
        // But for specific user request: "game hanya bisa dimulai jika ada 2 player"
        if (this.sessions[0] === null || this.sessions[1] === null) {
             this.io.to(this.roomId).emit("toast", { msg: "Cannot start battle: Waiting for 2nd player.", type: "warning" });
             return;
        }

        this.gameState.phase = 'battle';
        this.gameState.prepEndTime = null; 
        
        this.io.to(this.roomId).emit("curtain_drop");

        // Roll Omen
        const omen = rollOmen(this.gameState);
        if (omen) {
            this.io.to(this.roomId).emit("omen_announcement", { 
                name: omen.name, 
                description: omen.description,
                type: "major"
            });
        } else {
            this.io.to(this.roomId).emit("omen_announcement", {
                name: "The Void",
                description: "No Omen appears this night.",
                type: "minor"
            });
        }

        // Initialize Hands
        [0, 1].forEach(teamId => {
            const player = this.gameState.players[teamId];
            if (player.deck.length !== DECK_SIZE) {
                player.deck = createRandomDeck(player.faction);
            }
            player.hand = [];
            for (let i = 0; i < HAND_SIZE; i++) {
                const randomCardId = player.deck[Math.floor(Math.random() * player.deck.length)];
                player.hand.push(randomCardId);
            }
            player.next = player.deck[Math.floor(Math.random() * player.deck.length)];
        });

        this.io.to(this.roomId).emit("toast", { msg: "Battle Started!", type: "success" });
        this.io.to(this.roomId).emit("state", this.gameState);
    }

    submitDeck(teamId, cardIds, socket) {
        if (teamId === -1) return;
        if (this.gameState.phase !== 'preparation' && this.gameState.phase !== 'deck_building') return;

        const player = this.gameState.players[teamId];
        if (player.ready) return; 

        if (!Array.isArray(cardIds) || cardIds.length !== DECK_SIZE) {
            socket.emit("toast", { msg: `Destiny requires exactly ${DECK_SIZE} cards.`, type: "error" });
            return;
        }

        let tabooCount = 0;
        for (const id of cardIds) {
            const cardData = CARDS[id];
            if (!cardData) {
                 socket.emit("toast", { msg: `Invalid Arcanum ID: ${id}`, type: "error" });
                 return;
            }
            if (cardData.minFaction !== 'neutral' && cardData.minFaction !== player.faction) {
                socket.emit("toast", { msg: `The ${cardData.name} refuses your call (${cardData.minFaction} only).`, type: "error" });
                return;
            }
            if (cardData.isTaboo) tabooCount++;
        }

        if (tabooCount > MAX_TABOO_CARDS) {
            socket.emit("toast", { msg: `The veil cannot sustain more than ${MAX_TABOO_CARDS} Taboo card!`, type: "error" });
            return;
        }

        player.deck = cardIds;
        player.ready = true;
        socket.emit("toast", { msg: "Your fate is sealed. Waiting for the adversary...", type: "success" });

        // Check Start
        const p0 = this.gameState.players[0];
        const p1 = this.gameState.players[1];
        
        // Wait for BOTH to be ready
        if (p0.ready && p1.ready) {
             // DOUBLE CHECK 2 Players are actually connected/present
             if (this.sessions[0] && this.sessions[1]) {
                this.startBattle();
             } else {
                this.io.to(this.roomId).emit("toast", { msg: "Waiting for second player to join...", type: "info" });
             }
        }
    }

    spawnUnit(teamId, data, socket) {
        if (teamId === -1) return;
        
        const card = CARDS[data.cardId];
        if (!card) return;

        let success = false;
        if (card.type === 'SANCTUM') {
            success = playSanctumCard(this.gameState, teamId, data.cardId, data.col, data.row);
        } else {
             // Default to Unit (VESSEL)
            success = playUnitCard(this.gameState, teamId, data.cardId, data.col, data.row);
        }
        
        // if (!success) socket.emit("error", "Invalid spawn");
    }

    castRitual(teamId, data, socket) {
        if (this.gameState.phase !== "battle") return;
        if (teamId === -1) return;
        playSpellCard(this.gameState, socket.id, teamId, data.cardId, data.col, data.row, data.targetId);
    }

    handleRematch(teamId) {
        if (this.gameState.phase !== "ended") return;
        if (teamId === -1) return;

        this.rematchVotes.add(teamId);
        this.gameState.rematchCount = this.rematchVotes.size;

        if (this.rematchVotes.has(0) && this.rematchVotes.has(1)) {
            // Check connected again?
             if (this.sessions[0] && this.sessions[1]) {
                this.resetGame();
             }
        }
    }

    resetGame() {
        this.gameState = createGameState();
        this.rematchVotes.clear();
        this.io.to(this.roomId).emit("toast", { msg: "The cycle begins anew...", type: "success" });
    }

    // Utils
    getFactionLoreName(id) {
        const p = this.gameState.players[id];
        if (!p) return `Team ${id}`;
        return p.faction === 'solaris' ? "The Order of Solaris" : "The Cult of Noctis";
    }
    
    destroy() {
        if (this.intervalId) clearInterval(this.intervalId);
    }
}
