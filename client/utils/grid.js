import { GRID, LANE_COLUMNS } from "../../shared/constants.js";
import { myTeamId } from "../state/gameState.js";

export function createGrid(app) {
  const usableWidth = app.screen.width;
  const usableHeight = app.screen.height;
  
  // Hitung ukuran cell baru yang lebih kecil
  const cellSize = Math.min(
    usableWidth / GRID.cols,
    usableHeight / GRID.rows
  );

  const boardWidth = cellSize * GRID.cols;
  const boardHeight = cellSize * GRID.rows;

  const offsetX = (usableWidth - boardWidth) / 2;
  const offsetY = (usableHeight - boardHeight) / 2;

  return {
    cols: GRID.cols,
    rows: GRID.rows,
    cellSize,
    boardWidth,
    boardHeight,
    offsetX,
    offsetY,
  };
}

export function unitToScreen(unit, grid) {
  // 1. Tentukan Kolom & Baris Asli Server
  let serverCol = (typeof unit.col !== 'undefined') ? unit.col : LANE_COLUMNS[unit.lane];
  let serverRow = unit.row; // Asumsi unit.row sudah ada (karena grid system)
  
  // Fallback rowProgress jika row belum ada (legacy support)
  if (typeof serverRow === 'undefined') {
      serverRow = unit.rowProgress * grid.rows;
  }

  // === LOGIC ROTASI BOARD (Relative Perspective) ===
  // Jika saya Team 1 (Atas), saya ingin melihat diri saya di Bawah.
  // Maka, koordinat harus dibalik: 
  // - Server Row 33 (Base Team 1) -> Jadi Render Row 0 (Bawah)
  // - Server Col 18 (Kanan) -> Jadi Render Col 0 (Kiri)
  
  let renderCol = serverCol;
  let renderRow = serverRow;

  if (myTeamId === 1) {
      renderCol = (grid.cols - 1) - serverCol;
      renderRow = (grid.rows - 1) - serverRow;
  }

  // 2. Konversi ke Pixel (Render)
  // Rumus: Y = BoardBottom - (Row * CellSize) - HalfCell
  // Ini akan menaruh Row 0 di Bawah, dan Row 33 di Atas.
  
  const halfCell = grid.cellSize / 2;

  const x = grid.offsetX + (renderCol * grid.cellSize) + halfCell + (unit.offsetX || 0);

  // Perhatikan: Kita pakai renderRow di sini
  const y = grid.offsetY + grid.boardHeight - (renderRow * grid.cellSize) - halfCell + (unit.offsetY || 0);

  return { x, y };
}

