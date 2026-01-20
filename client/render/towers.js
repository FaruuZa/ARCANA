import { gameState } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";
import { SOLARIS_THEME } from "./themes/solaris.js";
import { NOCTIS_THEME } from "./themes/noctis.js";

const towerSprites = new Map();
let _app, _grid;

export function initTowers(app, grid) {
  _app = app;
  _grid = grid;
  
  const layer = new PIXI.Container();
  layer.zIndex = 5; // Di bawah unit
  app.stage.addChild(layer);

  gameState.subscribe((state) => {
    syncTowers(state.buildings, layer);
  });
}

function syncTowers(buildings, layer) {
  const activeIds = new Set();

  buildings.forEach(b => {
    activeIds.add(b.id);
    let container = towerSprites.get(b.id);

    if (!container) {
      container = createTowerVisual(b);
      towerSprites.set(b.id, container);
      layer.addChild(container);
      
      // Posisi Tower (Static, set sekali saja cukup sebenarnya, 
      // tapi kalau ada flip board perlu update posisi jika resize)
    }
    
    // Selalu update posisi (karena board bisa di-flip/resize)
    const pos = unitToScreen(b, _grid);
    container.x = pos.x;
    container.y = pos.y;

    updateTowerHP(container, b);
  });

  // Hapus tower hancur
  for (const [id, container] of towerSprites) {
    if (!activeIds.has(id)) {
      container.destroy();
      towerSprites.delete(id);
    }
  }
}

function createTowerVisual(building) {
  const container = new PIXI.Container();
  
  const isKing = building.type === 'king';
  const size = isKing ? _grid.cellSize * 1.2 : _grid.cellSize * 0.8;
  const color = building.team === 0 ? SOLARIS_THEME.towers.base : NOCTIS_THEME.towers.base;

  // Body
  const g = new PIXI.Graphics();
  g.beginFill(color);
  if (isKing) {
      g.drawRect(-size/2, -size/2, size, size); // Kotak besar
  } else {
      g.drawRect(-size/2, -size/2, size, size); // Kotak kecil
  }
  g.endFill();
  
  // Border
  g.lineStyle(2, 0xFFFFFF);
  g.drawRect(-size/2, -size/2, size, size);
  
  container.addChild(g);

  // debug: Range Circle
  const rangeCircle = new PIXI.Graphics();
  rangeCircle.lineStyle(1, 0xFFFFFF, 0.3); // Putih transparan
  rangeCircle.drawCircle(0, 0, building.range * _grid.cellSize);
  container.addChild(rangeCircle);

  // HP Bar (Lebih besar dari unit)
  const barW = 40;
  const barH = 8;
  const yOffset = -size/2 - 15;

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000);
  bg.drawRect(-barW/2, yOffset, barW, barH);
  container.addChild(bg);

  const fill = new PIXI.Graphics();
  fill.name = "hpBar";
  container.addChild(fill);

  return container;
}

function updateTowerHP(container, building) {
  const barFill = container.getChildByName("hpBar");
  if (!barFill) return;

  const pct = Math.max(0, building.hp / building.maxHp);
  const barW = 40;
  const barH = 8;
  const isKing = building.type === 'king';
  const size = isKing ? _grid.cellSize * 1.2 : _grid.cellSize * 0.8;
  const yOffset = -size/2 - 15;

  barFill.clear();
  barFill.beginFill(0x00FF00); // Tower selalu hijau sampai hancur (opsional)
  barFill.drawRect(-barW/2 + 1, yOffset + 1, (barW - 2) * pct, barH - 2);
  barFill.endFill();
}