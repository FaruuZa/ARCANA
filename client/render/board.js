export function initBoard(app, theme) {
  const g = new PIXI.Graphics();

  const W = app.screen.width;
  const H = app.screen.height;

  // === BACKGROUND
  g.beginFill(theme.board.background);
  g.drawRect(0, 0, W, H);
  g.endFill();

  // === RIVER
  const riverY = H / 2;
  g.beginFill(theme.board.river);
  g.drawRect(0, riverY - 20, W, 40);
  g.endFill();

  // === LANE DIVIDER (VISUAL)
  g.lineStyle(2, theme.board.laneLine, 0.6);
  g.moveTo(0, riverY);
  g.lineTo(W, riverY);

  app.stage.addChild(g);
}
