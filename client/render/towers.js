import { gameState } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";
import { SOLARIS_THEME } from "./themes/solaris.js";
import { NOCTIS_THEME } from "./themes/noctis.js";
import { getUnitTexture } from "./visuals/generator.js"; // [NEW] Use Generator
import { BLUEPRINTS } from "./visuals/blueprints.js"; // [NEW] Scaling

const towerSprites = new Map();
let _app, _grid;

export function initTowers(app, grid) {
  _app = app;
  _grid = grid;

  const layer = new PIXI.Container();
  layer.zIndex = 5; // Di bawah unit
  app.stage.addChild(layer);

  let lastBuildings = [];

  gameState.subscribe((state) => {
    lastBuildings = state.buildings;
    syncTowers(state.buildings, layer, state.players);
  });

  return {
    resize: () => syncTowers(lastBuildings, layer, gameState.players)
  };
}

function syncTowers(buildings, layer, players) {
  const activeIds = new Set();

  buildings.forEach(b => {
    activeIds.add(b.id);
    let container = towerSprites.get(b.id);

    const owner = players[b.team];
    const faction = owner ? owner.faction : (b.team === 0 ? 'solaris' : 'noctis');

    // Theme change check
    if (container && container.faction !== faction) {
      container.destroy();
      towerSprites.delete(b.id);
      container = null;
    }

    if (!container) {
      container = createTowerVisual(b, faction);
      towerSprites.set(b.id, container);
      layer.addChild(container);
    }

    const pos = unitToScreen(b, _grid);
    container.x = pos.x;
    container.y = pos.y;

    // [FIX] Force Redraw every sync to handle Resize/Grid changes
    redrawTowerVisual(container, b, faction);

    updateTowerHP(container, b);
  });

  // Cleanup
  for (const [id, container] of towerSprites) {
    if (!activeIds.has(id)) {
      container.destroy();
      towerSprites.delete(id);
    }
  }
}

function createTowerVisual(building, faction) {
  const container = new PIXI.Container();
  container.faction = faction;

  const g = new PIXI.Graphics();
  g.name = "towerGfx"; // Tag for retrieval
  container.addChild(g);

  // HP Bar Base
  const bg = new PIXI.Graphics();
  bg.name = "hpBg";
  container.addChild(bg);

  const fill = new PIXI.Graphics();
  fill.name = "hpBar";
  container.addChild(fill);

  // [NEW] Sprite for Sanctums
  const sprite = new PIXI.Sprite();
  sprite.name = "unitSprite";
  sprite.anchor.set(0.5);
  sprite.visible = false;
  container.addChild(sprite); // Add sprite for blueprint-based buildings

  return container;
}

function redrawTowerVisual(container, building, faction) {
  const g = container.getChildByName("towerGfx");
  if (!g) return;

  const isKing = building.type === 'king';
  // If not king/side, use radius or default to 1 for generic buildings
  const isStandardTower = (building.type === 'king' || building.type === 'side');
  let size = isStandardTower ? (isKing ? _grid.cellSize * 1.5 : _grid.cellSize * 1.0) : (_grid.cellSize * (building.radius || 1.0) * 2);

  // Redraw HP Bar Background to match new size
  const bg = container.getChildByName("hpBg");
  const sprite = container.getChildByName("unitSprite"); // [NEW]
  if (bg) {
    const barW = size;
    const barH = 6;
    const yOffset = size / 2 + 8;
    bg.clear();
    bg.beginFill(0x000000, 0.8);
    bg.drawRect(-barW / 2, yOffset, barW, barH);
    bg.endFill();
  }

  // Determine Type
  if (building.type === 'king' || building.type === 'side') {
    sprite.visible = false;
    g.visible = true;

    // Draw Unique Faction Tower
    switch (faction) {
      case 'solaris': drawSolarisTower(g, size, isKing); break;
      case 'noctis': drawNoctisTower(g, size, isKing); break;
      case 'mortis': drawMortisTower(g, size, isKing); break;
      case 'chronis': drawChronisTower(g, size, isKing); break;
      default: drawSolarisTower(g, size, isKing); break;
    }
  } else {
    // SANCTUM / BLUEPRINT BASED
    g.clear();
    g.visible = false;
    sprite.visible = true;

    const texture = getUnitTexture(_app, building.type, faction);
    if (texture) {
      sprite.texture = texture;

      // Scaling Logic similarly to ghost.js
      const blueprint = BLUEPRINTS[building.type];
      if (blueprint) {
        const baseScale = blueprint.scale || 1.0;
        // visual generator uses r=20 -> ~40px size
        const textureSize = 44;
        // We want to match grid.cellSize * baseScale?
        // Or specific radius? 
        // Standard unit scale in ghost.js:
        // const targetPixelSize = (unitRadius * 2) * _grid.cellSize;
        // let scaleVal = targetPixelSize / baseTextureSize;

        // Let's use building.radius if available or default
        const radius = building.radius || 1.0;
        const targetSize = (radius * 2) * _grid.cellSize * (baseScale); // multiply baseScale for visual flair

        sprite.width = targetSize;
        sprite.height = targetSize;
      } else {
        sprite.width = _grid.cellSize;
        sprite.height = _grid.cellSize;
      }
    }
  }
}

function drawSolarisTower(g, size, isKing) {
  const theme = SOLARIS_THEME.towers;
  const w = size * (isKing ? 0.7 : 0.5);
  const isBottom = false; // logic visual not dependant on position

  g.clear();

  // -- SHADOW --
  g.beginFill(0x000000, 0.3);
  g.drawEllipse(0, size / 3, w, w / 3);
  g.endFill();

  // -- BASE --
  // White Marble Cylinder
  g.beginFill(theme.secondary);
  g.drawRect(-w / 2, -size / 2, w, size);
  g.endFill();

  // -- GOLD TRIM --
  g.beginFill(theme.base);
  // Base Ring
  g.drawRect(-w * 0.6, size / 2 - 5, w * 1.2, 5);
  // Top Ring
  g.drawRect(-w * 0.6, -size / 2, w * 1.2, 5);
  // Vertical Stripe
  g.drawRect(-2, -size / 2, 4, size);
  g.endFill();

  // -- CORE --
  g.beginFill(theme.detail); // Blue
  if (isKing) {
    // Large Sun Sphere
    g.drawCircle(0, -size / 2 - 10, w * 0.8);

    // Rays
    g.lineStyle(2, theme.base);
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 / 8) * i;
      const r1 = w * 0.8;
      const r2 = w * 1.2;
      g.moveTo(Math.cos(ang) * r1, -size / 2 - 10 + Math.sin(ang) * r1);
      g.lineTo(Math.cos(ang) * r2, -size / 2 - 10 + Math.sin(ang) * r2);
    }
    g.lineStyle(0);
  } else {
    // Floating Crystal
    const d = w * 0.6;
    g.drawRect(-d / 2, -size / 2 - d - 5, d, d); // Diamond rotated?
  }
  g.endFill();
}

function drawNoctisTower(g, size, isKing) {
  const theme = NOCTIS_THEME.towers;
  const w = size * (isKing ? 0.7 : 0.5);

  g.clear();

  // -- SHADOW --
  g.beginFill(0x000000, 0.3);
  g.drawEllipse(0, size / 3, w, w / 3);
  g.endFill();

  // -- STRUCTURE --
  // Spiky Obsidian Shard
  g.beginFill(theme.secondary);
  g.drawPolygon([
    -w / 2, size / 2,   // Bottom Left
    w / 2, size / 2,    // Bottom Right
    w / 4, -size / 4,   // Mid Right
    0, -size / 2,     // Top Tip
    -w / 4, -size / 4   // Mid Left
  ]);
  g.endFill();

  // -- GLOWING VEINS --
  g.lineStyle(2, theme.detail);
  g.moveTo(0, size / 2);
  g.lineTo(0, -size / 2);
  g.lineStyle(0);

  // -- CRYSTAL / EYE --
  g.beginFill(theme.base);
  if (isKing) {
    // Eye of Sauron style
    g.drawEllipse(0, -size / 2 - 10, w / 1.5, w / 3);
    g.beginFill(theme.detail);
    g.drawCircle(0, -size / 2 - 10, 3);
  } else {
    // Floating Orb
    g.drawCircle(0, -size / 2 - 8, w / 3);
  }
  g.endFill();
}

import { MORTIS_THEME } from "./themes/mortis.js";
import { CHRONIS_THEME } from "./themes/chronis.js";

function drawMortisTower(g, size, isKing) {
  const theme = MORTIS_THEME.towers;
  const w = size * (isKing ? 0.8 : 0.6);

  g.clear();

  // -- SHADOW --
  g.beginFill(0x000000, 0.4);
  g.drawEllipse(0, size / 3, w, w / 3);
  g.endFill();

  // -- BASE (Bone/Crypt) --
  g.beginFill(theme.secondary); // Sea Green / Grey
  // Tombstone shape
  g.drawRect(-w / 2, -size / 3, w, size * 0.8);
  g.drawCircle(0, -size / 3, w / 2);
  g.endFill();

  // -- ACCENTS --
  g.beginFill(theme.base); // Dark Red
  g.drawRect(-w / 4, 0, w / 2, size / 4); // Door
  g.endFill();

  // -- TOP --
  if (isKing) {
    // Skull shape approximation
    g.beginFill(0xF5F5DC); // Bone White
    g.drawCircle(0, -size / 2 - 5, w * 0.6);
    g.beginFill(0x000000); // Eyes
    g.drawCircle(-w * 0.2, -size / 2 - 5, w * 0.15);
    g.drawCircle(w * 0.2, -size / 2 - 5, w * 0.15);

    // Crown
    g.beginFill(theme.king); // Purple
    g.drawPolygon([
      -w * 0.3, -size / 2 - 15,
      0, -size / 2 - 25,
      w * 0.3, -size / 2 - 15
    ]);
    g.endFill();
  } else {
    // Small bone spire
    g.beginFill(0xF5F5DC);
    g.drawPolygon([
      -5, -size / 2,
      5, -size / 2,
      0, -size / 2 - 15
    ]);
    g.endFill();
  }
}

function drawChronisTower(g, size, isKing) {
  const theme = CHRONIS_THEME.towers;
  const w = size * (isKing ? 0.7 : 0.5);

  g.clear();

  // -- SHADOW --
  g.beginFill(0x000000, 0.3);
  g.drawEllipse(0, size / 3, w, w / 3);
  g.endFill();

  // -- AXIS --
  g.lineStyle(4, theme.secondary); // Silver
  g.moveTo(0, size / 2);
  g.lineTo(0, -size / 2);
  g.lineStyle(0);

  // -- RINGS (Gears) --
  g.lineStyle(3, theme.base); // Blue
  g.drawCircle(0, 0, w * 0.6);
  g.lineStyle(2, theme.detail); // Gold
  g.drawCircle(0, -size / 4, w * 0.4);
  g.lineStyle(0);

  // -- CRYSTAL --
  if (isKing) {
    // Floating Hourglass/Diamond
    g.beginFill(theme.king); // Cyan
    g.drawPolygon([
      -w / 2, -size / 2 - 10,
      w / 2, -size / 2 - 10,
      0, -size / 2 + 20
    ]);
    g.drawPolygon([
      -w / 2, -size / 2 - 10,
      w / 2, -size / 2 - 10,
      0, -size / 2 - 40
    ]);
    g.endFill();
  } else {
    // Small Crystal
    g.beginFill(theme.princess);
    g.drawCircle(0, -size / 2, w / 3);
    g.endFill();
  }
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
  const isKing = building.type === 'king';
  const size = isKing ? _grid.cellSize * 1.5 : _grid.cellSize * 1.0;

  const barW = size;
  const barH = 6;
  const yOffset = size / 2 + 8;

  barFill.clear();

  // Color based on HP
  let color = 0x00FF00;
  if (pct < 0.5) color = 0xFFFF00;
  if (pct < 0.25) color = 0xFF0000;

  barFill.beginFill(color);
  barFill.drawRect(-barW / 2, yOffset, barW * pct, barH);
  barFill.endFill();
}