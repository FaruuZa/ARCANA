import { GRID, LANE_COLUMNS } from "../../shared/constants.js";

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
  // 1. Tentukan Kolom
  let colIndex;
  if (typeof unit.col !== 'undefined') {
      colIndex = unit.col;
  } else {
      colIndex = LANE_COLUMNS[unit.lane];
  }

  // 2. Tentukan Baris
  let visualRow;
  if (typeof unit.row !== 'undefined') {
      visualRow = grid.rows - unit.row;
  } else {
      visualRow = grid.rows - (unit.rowProgress * grid.rows);
  }

  // === PERBAIKAN: CENTERING ===
  // Tambahkan grid.cellSize / 2 agar titik (x,y) berada di TENGAH kotak, bukan di pojok kiri atas
  const halfCell = grid.cellSize / 2;

  const x =
    grid.offsetX +
    (colIndex * grid.cellSize) + 
    halfCell +               // <-- Centering X
    (unit.offsetX || 0);

  const y =
    grid.offsetY +
    (visualRow * grid.cellSize) - // Perhatikan minus/plus arah row
    halfCell +               // <-- Centering Y (karena y visualRow adalah "bottom line" dari row tersebut jika pakai logika grid.rows - unit.row. Mari kita sesuaikan logika ini.)
    (unit.offsetY || 0);
  
  // KOREKSI VISUAL ROW:
  // Server Row 0 = Titik paling bawah board.
  // Visual Canvas Y paling bawah = offsetY + boardHeight.
  // Rumus yang lebih aman:
  // Y = (Board Bottom) - (Row * CellSize) - HalfCell
  
  const safeY = grid.offsetY + grid.boardHeight - (unit.row * grid.cellSize) - halfCell;

  // Jika unit masih pakai rowProgress lama (fallback)
  if (typeof unit.row === 'undefined') {
     return { x, y: grid.offsetY + (grid.rows - unit.rowProgress * grid.rows) * grid.cellSize }; 
  }

  return { x, y: safeY };
}

