import { initSocket } from "../net/socket.js";
import { createGrid } from "../utils/grid.js";
import { GRID } from "../../shared/constants.js";
import { selection, clearSelection } from "../state/selection.js"; // Import Seleksi
import { myTeamId } from "../state/gameState.js"; // Import myTeamId
import { CARDS } from "../../shared/data/cards.js";

export function initInput(app) {
  const canvas = app.view;
    
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

    const socket = initSocket();
    const grid = createGrid(app);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;
    
    // 2. Hitung VISUAL GRID (Apa yang dilihat mata)
    // 0,0 ada di Pojok Kiri Atas layar
    const visualCol = Math.floor((clickX - grid.offsetX) / grid.cellSize);
    const visualRowFromTop = Math.floor((clickY - grid.offsetY) / grid.cellSize);

    // Validasi Bounds Visual
    if (visualCol < 0 || visualCol >= GRID.cols || visualRowFromTop < 0 || visualRowFromTop >= GRID.rows) {
        return; 
    }

    // 3. Konversi ke SERVER GRID (Sesuai Team)
    let serverCol, serverRow;

    if (myTeamId === 1) {
        // === TEAM 1 (PERSPEKTIF DIBALIK) ===
        // Visual Kiri (0) -> Server Kanan (18)
        // Visual Bawah (33) -> Server Atas/Base Team 1 (33)
        // Jadi Server Row = Visual Row (karena Visual 0 itu Top/Enemy, Server 0 itu Enemy)
        // TAPI: visualRowFromTop menghitung 0 dari atas.
        // Server Team 1 Base adalah 33. Musuh adalah 0.
        // Di layar Team 1: Musuh (0) ada di Atas (Visual 0). Base (33) ada di Bawah (Visual 33).
        // Jadi:
        
        serverCol = (GRID.cols - 1) - visualCol;
        serverRow = visualRowFromTop; // (Visual 0 -> Server 0, Visual 33 -> Server 33)
        
        // Koreksi kecil: VisualRowFromTop range 0..33. 
        // Jika klik paling bawah, visualRowFromTop = 33. ServerRow = 33. Cocok.
        
    } else {
        // === TEAM 0 (NORMAL) ===
        // Visual Kiri (0) -> Server Kiri (0)
        // Visual Bawah (33) -> Server Bawah/Base Team 0 (0)
        
        serverCol = visualCol;
        serverRow = (GRID.rows - 1) - visualRowFromTop; 
    }

    console.log(`Input: Team ${myTeamId} | Vis[${visualCol},${visualRowFromTop}] -> Srv[${serverCol},${serverRow}]`);

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
  });
}