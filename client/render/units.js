import { gameState } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";
import { SOLARIS_THEME } from "./themes/solaris.js";
import { NOCTIS_THEME } from "./themes/noctis.js";

const unitSprites = new Map();
let _app, _grid;

export function initUnits(app, grid) {
  _app = app;
  _grid = grid;
  
  const layer = new PIXI.Container();
  layer.sortableChildren = true; // Agar unit tumpuk-menumpuk dengan benar (Y-sort)
  layer.zIndex = 10;
  app.stage.addChild(layer);

  gameState.subscribe((state) => {
    syncUnits(state.units, layer);
  });
}

function syncUnits(units, layer) {
  const activeIds = new Set();

  units.forEach(unit => {
    activeIds.add(unit.id);
    let container = unitSprites.get(unit.id);

    if (!container) {
      // Create New Unit Visual
      container = createUnitVisual(unit);
      unitSprites.set(unit.id, container);
      layer.addChild(container);
    }

    // Update Posisi
    const pos = unitToScreen(unit, _grid);
    container.x = pos.x;
    container.y = pos.y;
    
    // Z-Index (Unit di bawah harus menutupi unit di atasnya)
    container.zIndex = Math.floor(container.y);

    // Update HP Bar
    updateHealthBar(container, unit);
  });

  // Cleanup unit mati
  for (const [id, container] of unitSprites) {
    if (!activeIds.has(id)) {
      container.destroy();
      unitSprites.delete(id);
    }
  }
}

function createUnitVisual(unit) {
  const container = new PIXI.Container();

  // 1. Body Unit (Ganti dengan Sprite nanti)
  const g = new PIXI.Graphics();
  
  // Warna berdasarkan Team
  const color = unit.team === 0 ? SOLARIS_THEME.units.primary : NOCTIS_THEME.units.primary;
  
  g.beginFill(color);
  g.drawCircle(0, 0, _grid.cellSize * 0.3); // Ukuran body
  g.endFill();
  
  // Border Team
  g.lineStyle(2, 0xFFFFFF);
  g.drawCircle(0, 0, _grid.cellSize * 0.3);

  container.addChild(g);

  // 2. HP Bar Background (Hitam)
  const barBg = new PIXI.Graphics();
  barBg.beginFill(0x000000);
  barBg.drawRect(-15, -25, 30, 6); // Offset ke atas kepala
  barBg.endFill();
  container.addChild(barBg);

  // 3. HP Bar Fill (Hijau/Merah) -> Simpan referensi biar bisa diupdate
  const barFill = new PIXI.Graphics();
  barFill.name = "hpBar"; // Tagging
  container.addChild(barFill);

  return container;
}

function updateHealthBar(container, unit) {
  const barFill = container.getChildByName("hpBar");
  if (!barFill) return;

  const pct = Math.max(0, unit.hp / unit.maxHp);
  
  barFill.clear();

  // Warna: Hijau (>50%) -> Kuning -> Merah (<25%)
  let color = 0x00FF00;
  if (pct < 0.5) color = 0xFFFF00;
  if (pct < 0.25) color = 0xFF0000;

  barFill.beginFill(color);
  barFill.drawRect(-14, -24, 28 * pct, 4); // Lebar 28px (dikurangi padding 1px)
  barFill.endFill();
  
  // Sembunyikan bar jika HP penuh (biar bersih)
  // Kecuali jika sedang diserang (opsional, tapi simple-nya hide kalau full)
  container.children[1].visible = pct < 1.0; // Bg
  barFill.visible = pct < 1.0; // Fill
}