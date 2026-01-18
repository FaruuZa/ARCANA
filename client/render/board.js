export function initBoard(app, grid) {
  const g = new PIXI.Graphics();

  // Background board
  g.beginFill(0xf2efe9);
  g.drawRect(
    grid.offsetX,
    grid.offsetY,
    grid.boardWidth,
    grid.boardHeight
  );
  g.endFill();

  // Grid lines
  g.lineStyle(1, 0xcccccc, 0.5);

  for (let c = 0; c <= grid.cols; c++) {
    const x = grid.offsetX + c * grid.cellSize;
    g.moveTo(x, grid.offsetY);
    g.lineTo(x, grid.offsetY + grid.boardHeight);
  }

  for (let r = 0; r <= grid.rows; r++) {
    const y = grid.offsetY + r * grid.cellSize;
    g.moveTo(grid.offsetX, y);
    g.lineTo(grid.offsetX + grid.boardWidth, y);
  }

  app.stage.addChild(g);
}
