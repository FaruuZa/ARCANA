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
  const socket = initSocket();
    
    canvas.addEventListener("pointermove", (event) => {
    if (myTeamId === -1 || !selection.cardId) return;

    const grid = createGrid(app); // Re-calc grid (in case resize)
    const { serverCol, serverRow, isValid } = getGridPosition(canvas, event, grid);

    if (isValid) {
        updateGhostPosition(serverCol, serverRow);
    }
  });

  window.addEventListener("pointermove", (event) => {
    if (myTeamId === -1 || !selection.cardId) {
        // Reset ghost jika tidak ada seleksi
        updateGhostPosition(-1, -1);
        return;
    }

    const grid = createGrid(app);
    const { serverCol, serverRow, isValid } = getGridPosition(canvas, event, grid);

    if (isValid) {
        updateGhostPosition(serverCol, serverRow);
    } else {
        updateGhostPosition(-1, -1); // Hide ghost jika keluar arena
    }
  });

  // 2. HANDLER UP (SPAWN) - Global Window
  // Spawn terjadi saat jari diangkat (Touch Up / Mouse Up)
  window.addEventListener("pointerup", (event) => {
    if (myTeamId === -1) return;
    if (!selection.cardId || selection.index === -1) return;

    const cardData = CARDS[selection.cardId];
    if (!cardData) return;

    const grid = createGrid(app);
    const { serverCol, serverRow, isValid } = getGridPosition(canvas, event, grid);

    // === LOGIC PENENTUAN ===
    if (isValid) {
        // A. Jari dilepas di area VALID -> SPAWN
        if (cardData.type === "RITUAL") {
            socket.emit("cast_ritual", {
                col: serverCol,
                row: serverRow,
                cardId: selection.cardId
            });
        } else {
            socket.emit("spawn_unit", {
                col: serverCol,
                row: serverRow,
                cardId: selection.cardId
            });
        }
        
        clearSelection();
        updateGhostPosition(-1, -1);
    
    } else {
        // B. Jari dilepas di area INVALID (Contoh: Balik ke tangan / Luar map)
        
        // Pengecualian: Jika dilepas tepat di atas KARTU (Klik biasa), jangan cancel.
        // Biarkan player memilih kartu lain atau klik canvas nanti.
        if (event.target.closest && event.target.closest('.hand-card')) {
            // Do nothing (Switch selection handled by ui.js)
        } else {
            // Cancel Selection (Membatalkan)
            clearSelection();
            updateGhostPosition(-1, -1);
        }
    }
  });
}

// Helper: Hitung Posisi Grid dari Event Mouse
function getGridPosition(canvas, event, grid) {
    const rect = canvas.getBoundingClientRect();
    
    // Cek apakah pointer ada di dalam bounding box Canvas
    // (Penting: event window coordinates bisa dimana saja)
    const isInsideX = event.clientX >= rect.left && event.clientX <= rect.right;
    const isInsideY = event.clientY >= rect.top && event.clientY <= rect.bottom;

    if (!isInsideX || !isInsideY) {
        return { isValid: false };
    }

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