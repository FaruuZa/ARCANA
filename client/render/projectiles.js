import { gameState } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";

const projSprites = new Map();
let _app = null;
let _grid = null;

export function initProjectiles(app, grid) {
  _app = app;
  _grid = grid;
  const layer = new PIXI.Container();
  layer.zIndex = 20; // Di atas unit
  app.stage.addChild(layer);

  return { layer };
}

export function syncProjectiles(projectiles = [], layer) {
  if (!_grid || !layer.parent) return;

  const aliveIds = new Set(projectiles.map(p => p.id));

  // Cleanup
  for (const [id, sprite] of projSprites) {
    if (!aliveIds.has(id)) {
      sprite.destroy();
      projSprites.delete(id);
    }
  }

  // Update/Create
  for (const proj of projectiles) {
    let sprite = projSprites.get(proj.id);

    if (!sprite) {
      sprite = createProjectileSprite(proj);
      projSprites.set(proj.id, sprite);
      layer.addChild(sprite);
    }

    // Posisi
    // Kita buat object dummy agar bisa masuk fungsi unitToScreen
    const posData = { row: proj.row, col: proj.col, offsetX: 0, offsetY: 0 };
    const screenPos = unitToScreen(posData, _grid);

    sprite.x = screenPos.x;
    sprite.y = screenPos.y;
  }
}

function createProjectileSprite(proj) {
  const g = new PIXI.Graphics();
  
  // Warna peluru (Kuning biar kelihatan)
  g.beginFill(0xFFFF00); 
  g.drawCircle(0, 0, 5); // Kecil saja
  g.endFill();

  return g;
}