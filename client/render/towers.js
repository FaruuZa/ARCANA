export function initTowers(app, theme) {
  const layer = new PIXI.Container();

  const W = app.screen.width;
  const H = app.screen.height;

  const towerRadius = 28;

  function drawTower(x, y, color) {
    const g = new PIXI.Graphics();
    g.beginFill(color);
    g.drawCircle(0, 0, towerRadius);
    g.endFill();
    g.x = x;
    g.y = y;
    layer.addChild(g);
  }

  // Friendly (bottom)
  drawTower(W / 2, H - 60, theme.tower.friendly);

  // Enemy (top)
  drawTower(W / 2, 60, theme.tower.enemy);

  app.stage.addChild(layer);
}
