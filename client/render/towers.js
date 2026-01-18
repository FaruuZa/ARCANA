import { gameState } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";
// Import tema agar tower warnanya sesuai faksi
import { SOLARIS_THEME } from "./themes/solaris.js";
import { NOCTIS_THEME } from "./themes/noctis.js";

const towerSprites = new Map();
let _app = null;
let _grid = null;

export function initTowers(app, grid) {
  _app = app;
  _grid = grid;
  const layer = new PIXI.Container();
  
  // Z-Index: Di atas Board (0), di bawah Unit (10)
  layer.zIndex = 5; 
  app.stage.addChild(layer);

  gameState.subscribe((state) => {
    syncTowers(state.buildings, layer);
  });
}

function syncTowers(towers = [], layer) {
    if (!_grid || !layer.parent) return;

    const aliveIds = new Set(towers.map(t => t.id));

    // 1. Cleanup tower yang hancur
    for (const [id, sprite] of towerSprites) {
        if (!aliveIds.has(id)) {
            sprite.destroy();
            towerSprites.delete(id);
        }
    }

    // 2. Update / Create tower
    for (const tower of towers) {
        let sprite = towerSprites.get(tower.id);

        if (!sprite) {
            // Create sprite baru berdasarkan tipe dan tim
            sprite = createTowerSprite(tower, _grid.cellSize);
            towerSprites.set(tower.id, sprite);
            layer.addChild(sprite);
        }

        // Posisi: Gunakan data 'row' dan 'col' dari server
        // Kita manfaatkan fungsi unitToScreen yang sudah diperbaiki di utils/grid.js
        // Kita buat objek dummy yang strukturnya mirip unit
        const posData = { row: tower.row, col: tower.col, offsetX: 0, offsetY: 0 };
        const screenPos = unitToScreen(posData, _grid);

        sprite.x = screenPos.x;
        sprite.y = screenPos.y;
    }
}

function createTowerSprite(tower, cellSize) {
    const g = new PIXI.Graphics();
    const theme = tower.team === 0 ? SOLARIS_THEME : NOCTIS_THEME;
    const color = theme.tower.friendly;

    g.beginFill(color);

    // Scaling ukuran tower terhadap cell baru yang lebih kecil
    // King = 3x3 cell (lebih besar dan megah)
    // Side = 2x2 cell
    const scale = tower.type === 'king' ? 2.5 : 1.8; 
    const size = cellSize * scale;
    
    // Draw Centered
    g.drawRect(-size/2, -size/2, size, size); 
    g.endFill();

    // Indikator arah
    g.beginFill(0xFFFFFF, 0.5);
    const dir = tower.team === 0 ? -1 : 1; 
    g.drawRect(-2, (size/2 * dir) - 5, 4, 10);
    g.endFill();

    return g;
}