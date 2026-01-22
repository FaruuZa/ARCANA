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
    }
    
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
  const size = isKing ? _grid.cellSize * 1.3 : _grid.cellSize * 0.9;
  
  const g = new PIXI.Graphics();
  container.addChild(g);

  // Range Circle (Debug/Helper) - Buat lebih halus/tidak mengganggu
  const rangeCircle = new PIXI.Graphics();
  rangeCircle.lineStyle(1, 0xFFFFFF, 0.1); 
  rangeCircle.drawCircle(0, 0, building.range * _grid.cellSize);
  container.addChild(rangeCircle);

  // HP Bar Base
  const barW = 40;
  const barH = 6;
  const yOffset = -size/1.5 - 20;

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.7);
  bg.drawRect(-barW/2, yOffset, barW, barH);
  container.addChild(bg);

  const fill = new PIXI.Graphics();
  fill.name = "hpBar";
  container.addChild(fill);

  // Draw Unique Faction Tower
  const owner = gameState.players[building.team];
  const faction = owner ? owner.faction : (building.team === 0 ? 'solaris' : 'noctis');

  if (faction === 'solaris') {
      drawSolarisTower(g, size, isKing);
  } else {
      // Default to Noctis for 'noctis' or unknown
      drawNoctisTower(g, size, isKing);
  }

  return container;
}

function drawSolarisTower(g, size, isKing) {
    const theme = SOLARIS_THEME.towers;
    const w = size * 0.6; // Width of tower
    const h = size; // Height

    g.clear();

    // 0. Drop Shadow (Contrast against light map)
    g.beginFill(0x000000, 0.3);
    if (isKing) {
        drawHexagon(g, 4, 4, w);
    } else {
        g.drawCircle(3, 3, w/2);
    }
    g.endFill();

    // 1. Base Pillar (White Marble)
    g.beginFill(theme.secondary); 
    if (isKing) {
        // Hexagon Base
        drawHexagon(g, 0, 0, w);
    } else {
        // Circle/Cylinder Base
        g.drawCircle(0, 0, w/2);
    }
    g.endFill();

    // 2. Gold Accents (Corner Pillars or Rings)
    g.beginFill(theme.base);
    if (isKing) {
        g.drawRect(-w/2, -h/2, 5, h); // Left Pillar
        g.drawRect(w/2 - 5, -h/2, 5, h); // Right Pillar
        g.drawRect(-w/2, -h/2, w, 5); // Top Beam
    } else {
        g.drawCircle(0, 0, w/2 - 5); // Inner Gold Ring
    }
    g.endFill();

    // 3. Energy Core (Blue/Cyan)
    g.beginFill(theme.detail);
    if (isKing) {
        g.drawCircle(0, 0, w/3);
    } else {
        // Crystal Floating (Diamond Shape instead of Box)
        const dSize = 7;
        g.drawPolygon([
            0, -dSize,
            dSize, 0,
            0, dSize,
            -dSize, 0
        ]);
    }
    g.endFill();
    
    if (isKing) {
        // Sun Halo
        g.lineStyle(2, 0xFFD700, 0.8);
        g.drawCircle(0, 0, w * 1.2);
    }
}

function drawNoctisTower(g, size, isKing) {
    const theme = NOCTIS_THEME.towers;
    const w = size * 0.7;

    g.clear();

    // 1. Base (Dark Obsidian/Purple)
    g.beginFill(theme.secondary);
    if (isKing) {
        // Spiky Fortress Base
        const path = [
            -w, 0,
            -w/2, -w,
            0, -w/2,
            w/2, -w,
            w, 0,
            0, w/2
        ];
        g.drawPolygon(path);
    } else {
        // Twisted Shard
        const path = [
            -w/2, w/2,
            w/2, w/2,
            0, -w/2
        ];
        g.drawPolygon(path);
    }
    g.endFill();

    // 2. Veins/Cracks (Glow)
    g.lineStyle(2, theme.detail);
    g.moveTo(0, 0);
    g.lineTo(0, -w/2);
    if (isKing) {
        g.moveTo(-w/2, 0); g.lineTo(w/2, 0);
    }
    g.lineStyle(0);

    // 3. Top Crystal/Eye
    g.beginFill(theme.base); // Purple
    g.drawCircle(0, -10, isKing ? 12 : 6);
    g.endFill();
}

// Utils
function drawHexagon(g, x, y, r) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        points.push(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }
    g.drawPolygon(points);
}

function updateTowerHP(container, building) {
  const barFill = container.getChildByName("hpBar");
  if (!barFill) return;

  const pct = Math.max(0, building.hp / building.maxHp);
  const barW = 40;
  const barH = 6;
  const isKing = building.type === 'king';
  const size = isKing ? _grid.cellSize * 1.3 : _grid.cellSize * 0.9;
  const yOffset = -size/1.5 - 20;

  barFill.clear();
  
  // Color based on HP
  let color = 0x00FF00;
  if (pct < 0.5) color = 0xFFFF00;
  if (pct < 0.25) color = 0xFF0000;

  barFill.beginFill(color);
  barFill.drawRect(-barW/2 + 1, yOffset + 1, (barW - 2) * pct, barH - 2);
  barFill.endFill();
}