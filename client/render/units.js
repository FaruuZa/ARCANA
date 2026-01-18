import { gameState } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js"; // Hapus import createGrid yg tidak perlu

const unitSprites = new Map();

let _app = null;
let _grid = null; // Simpan grid di variable module-level

export function initUnits(app, grid) { // Terima parameter grid
  _app = app;
  _grid = grid; // Simpan grid untuk dipakai di syncUnits

  const layer = new PIXI.Container();
  layer.zIndex = 10;
  app.stage.addChild(layer);
  app.stage.sortableChildren = true;

  gameState.subscribe((state) => {
    syncUnits(state.units, layer);
  });
}

function syncUnits(units = [], layer) {
  // Gunakan _grid yang sudah disimpan, jangan create baru
  if (!_app || !_grid || !layer.parent) return; 

  const aliveIds = new Set(units.map((u) => u.id));

  // 1. Hapus sprite unit yang mati
  for (const [id, sprite] of unitSprites) {
    if (!aliveIds.has(id)) {
      sprite.destroy();
      unitSprites.delete(id);
    }
  }

  // 2. Update/Create unit
  for (const unit of units) {
    let sprite = unitSprites.get(unit.id);

    if (!sprite) {
      sprite = createUnitSprite(unit);
      unitSprites.set(unit.id, sprite);
      layer.addChild(sprite);
    }

    // Gunakan fungsi unitToScreen dari utils/grid.js
    const pos = unitToScreen(unit, _grid);
    sprite.x = pos.x;
    sprite.y = pos.y;
  }
}

function createUnitSprite(unit) {
  const g = new PIXI.Graphics();
  
  if (unit.team === 0) {
    g.beginFill(0x0000ff); // BIRU
  } else {
    g.beginFill(0xff0000); // MERAH
  }

  g.drawCircle(0, 0, 5); 
  g.endFill();

  return g;
}