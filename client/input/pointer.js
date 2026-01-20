import { initSocket } from "../net/socket.js";
import { createGrid } from "../utils/grid.js";
import { GRID } from "../../shared/constants.js";
import { selection, clearSelection } from "../state/selection.js"; // Import Seleksi
import { myTeamId } from "../state/gameState.js"; // Import myTeamId
import { CARDS } from "../../shared/data/cards.js";
import { updateGhostPosition } from "../render/ghost.js";
import { gameState } from "../state/gameState.js";

export function initInput(app) {
  const canvas = app.view;
    
    canvas.addEventListener("pointermove", (event) => {
    if (myTeamId === -1 || !selection.cardId) return;

    const grid = createGrid(app); // Re-calc grid (in case resize)
    const { serverCol, serverRow, isValid } = getGridPosition(canvas, event, grid);

    if (isValid) {
        updateGhostPosition(serverCol, serverRow);
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
    // 0. Spectator tidak boleh input
    if (myTeamId === -1) {
        return;
    }

    // 1. Cek Selection
    if (!selection.cardId || selection.index === -1) {
        // console.log("No card selected!");
        return;
    }

    const cardData = CARDS[selection.cardId];
    if (!cardData) {
        console.error("Card data not found for ID:", selection.cardId);
        return;
    }

    const myPlayer = gameState.players[myTeamId];
    if (!myPlayer || myPlayer.arcana < cardData.cost) {
        console.log("Not enough arcana!");
        // Bisa tambah efek suara 'error' disini
        return; // JANGAN KIRIM KE SERVER
    }

    const socket = initSocket();
    const grid = createGrid(app);
    const { serverCol, serverRow, isValid } = getGridPosition(canvas, event, grid);

    if (!isValid) return;

    

    // 4. Kirim Spawn Request
    if (cardData.type === "RITUAL") {
        // EVENT BARU: CAST_RITUAL
        socket.emit("cast_ritual", {
            col: serverCol,
            row: serverRow,
            cardId: selection.cardId
        });
        console.log("Input: Cast Ritual");
    } else {
        // EVENT LAMA: SPAWN_UNIT (Vessel / Sanctum)
        socket.emit("spawn_unit", {
            col: serverCol,
            row: serverRow,
            cardId: selection.cardId
        });
        console.log("Input: Spawn Unit");
    }

    clearSelection();
    updateGhostPosition(-1, -1);
  });
}

// Helper: Hitung Posisi Grid dari Event Mouse
function getGridPosition(canvas, event, grid) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;
    
    const visualCol = Math.floor((clickX - grid.offsetX) / grid.cellSize);
    const visualRowFromTop = Math.floor((clickY - grid.offsetY) / grid.cellSize);

    if (visualCol < 0 || visualCol >= GRID.cols || visualRowFromTop < 0 || visualRowFromTop >= GRID.rows) {
        return { isValid: false };
    }

    let serverCol, serverRow;

    if (myTeamId === 1) {
        serverCol = (GRID.cols - 1) - visualCol;
        serverRow = visualRowFromTop; 
    } else {
        serverCol = visualCol;
        serverRow = (GRID.rows - 1) - visualRowFromTop; 
    }

    return { serverCol, serverRow, isValid: true };
}