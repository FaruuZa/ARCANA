export function createGrid(app) {
  const GRID_COLS = 9;
  const GRID_ROWS = 16;

  const usableWidth = app.screen.width;
  const usableHeight = app.screen.height;

  // Cari grid size maksimal yang MUAT
  const cellSize = Math.min(
    usableWidth / GRID_COLS,
    usableHeight / GRID_ROWS
  );

  const boardWidth = cellSize * GRID_COLS;
  const boardHeight = cellSize * GRID_ROWS;

  // Center board
  const offsetX = (usableWidth - boardWidth) / 2;
  const offsetY = (usableHeight - boardHeight) / 2;

  return {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    cellSize,
    boardWidth,
    boardHeight,
    offsetX,
    offsetY,
  };
}

export function unitToScreen(unit, grid) {
  const laneColumns = [2, 4, 6];

  const col = laneColumns[unit.lane];
  const row =
    unit.team === 0
      ? grid.rows - unit.rowProgress * grid.rows
      : unit.rowProgress * grid.rows;

  const x =
    grid.offsetX +
    col * grid.cellSize +
    unit.offsetX;

  const y =
    grid.offsetY +
    row * grid.cellSize +
    unit.offsetY;

  return { x, y };
}

