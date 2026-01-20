import { initSocket } from "../net/socket.js";
import { createGrid } from "../utils/grid.js";
import { GRID } from "../../shared/constants.js";
import { selection, clearSelection } from "../state/selection.js"; 
import { myTeamId, gameState } from "../state/gameState.js"; 
import { CARDS } from "../../shared/data/cards.js";
import { updateGhostPosition } from "../render/ghost.js";
// [NEW] Import Shake Visual
import { shakeCardVisual } from "../render/hand.js"; 

export function initInput(app) {
  const canvas = app.view;
  const socket = initSocket();
    
  // ... (Listener pointermove SAMA) ...
  canvas.addEventListener("pointermove", (event) => {
    if (myTeamId === -1 || !selection.cardId) return;
    const grid = createGrid(app);
    const { serverCol, serverRow, isValid } = getGridPosition(canvas, event, grid);
    if (isValid) updateGhostPosition(serverCol, serverRow);
  });

  window.addEventListener("pointermove", (event) => {
    if (myTeamId === -1 || !selection.cardId) {
        updateGhostPosition(-1, -1);
        return;
    }
    const grid = createGrid(app);
    const { serverCol, serverRow, isValid } = getGridPosition(canvas, event, grid);
    if (isValid) updateGhostPosition(serverCol, serverRow);
    else updateGhostPosition(-1, -1);
  });

  // HANDLER SPAWN
  window.addEventListener("pointerup", (event) => {
    if (myTeamId === -1) return;
    if (!selection.cardId || selection.index === -1) return;

    const cardData = CARDS[selection.cardId];
    if (!cardData) return;

    // [NEW] CEK DUIT SEBELUM DEPLOY
    const myPlayer = gameState.players[myTeamId];
    const currentArcana = myPlayer ? myPlayer.arcana : 0;

    if (currentArcana < cardData.cost) {
        // Uang Kurang -> SHAKE & CANCEL
        shakeCardVisual(selection.index);
        
        // [FIX REQUEST 1] Jangan clearSelection, biarkan tetap terpilih (active)
        // clearSelection(); 
        // updateGhostPosition(-1, -1);
        return; // Stop, jangan kirim spawn
    }

    const grid = createGrid(app);
    const { serverCol, serverRow, isValid } = getGridPosition(canvas, event, grid);

    if (isValid) {
        if (cardData.type === "RITUAL") {
            socket.emit("cast_ritual", { col: serverCol, row: serverRow, cardId: selection.cardId });
        } else {
            socket.emit("spawn_unit", { col: serverCol, row: serverRow, cardId: selection.cardId });
        }
        clearSelection();
        updateGhostPosition(-1, -1);
    
    } else {
        if (event.target.closest && event.target.closest('.hand-card')) {
             // User klik kartu lain, biarkan logic selectCard di hand.js jalan
        } else {
            clearSelection();
            updateGhostPosition(-1, -1);
        }
    }
  });
}

// ... (Helper getGridPosition SAMA) ...
function getGridPosition(canvas, event, grid) {
    const rect = canvas.getBoundingClientRect();
    const isInsideX = event.clientX >= rect.left && event.clientX <= rect.right;
    const isInsideY = event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!isInsideX || !isInsideY) return { isValid: false };

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;
    
    const visualCol = Math.floor((clickX - grid.offsetX) / grid.cellSize);
    const visualRowFromTop = Math.floor((clickY - grid.offsetY) / grid.cellSize);

    if (visualCol < 0 || visualCol >= GRID.cols || visualRowFromTop < 0 || visualRowFromTop >= GRID.rows) return { isValid: false };

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