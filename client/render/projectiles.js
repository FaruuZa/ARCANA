import { gameState } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";
import { WEAPONS } from "./visuals/parts/weapons.js"; // Reuse procedural assets

const projSprites = new Map();
let _app = null;
let _grid = null;

// Cache textures for performance
const PROJ_TEXTURES = new Map();

export function initProjectiles(app, grid) {
  _app = app;
  _grid = grid;
  const layer = new PIXI.Container();
  layer.zIndex = 20; 
  app.stage.addChild(layer);

  return { layer };
}

export function syncProjectiles(projectiles = [], layer) {
  if (!_grid || !layer.parent) return;

  const aliveIds = new Set(projectiles.map(p => p.id));

  // Cleanup
  for (const [id, container] of projSprites) {
    if (!aliveIds.has(id)) {
      container.destroy();
      projSprites.delete(id);
    }
  }

  // Update/Create
  for (const proj of projectiles) {
    let container = projSprites.get(proj.id);

    if (!container) {
      container = createProjectileVisual(proj);
      projSprites.set(proj.id, container);
      layer.addChild(container);
    }

    // === PARABOLIC ARC CALCULATION ===
    // Check if lobbed type
    const isLobbed = ['fireball', 'cannonball', 'bomb', 'mortar'].includes(proj.type);
    
    // Default: Linear position from server
    const currentPos = unitToScreen({ col: proj.col, row: proj.row }, _grid);
    
    let x = currentPos.x;
    let y = currentPos.y;
    let rotation = 0;

    if (isLobbed && proj.startCol !== undefined) {
        // Calculate Arc Height based on distance progress
        // 1. Get Start & End (Target) screen positions
        const startPos = unitToScreen({ col: proj.startCol, row: proj.startRow }, _grid);
        
        // Note: We don't know exact 'end' pos from proj data easily without targetId lookups.
        // BUT server sends current 'col/row' which is the 'actual' projectile position in 2D plane.
        
        // ARC LOGIC:
        // Visual Y = Linear Y - HeightOffset
        // HeightOffset = sin(progress * PI) * PeakHeight
        
        // Problem: Server only sends current position `t`. We can't easily know total distance without start/end.
        // Workaround: We trust server's linear movement. We just add a Visual Y-Offset based on distance traveled?
        // Let's rely on Start Position to calculate "Progress" roughly.
        // We know simple physics: Arc height determined by % distance covered.
        
        const dx = proj.col - proj.startCol;
        const dy = proj.row - proj.startRow;
        const distTraveled = Math.sqrt(dx*dx + dy*dy);
        
        // This is hard because we don't know TOTAL distance to hit target (target moves).
        // SIMPLIFIED VISUAL TRICK:
        // Use a "fake" height based purely on distance traveled? No, that looks like a ramp.
        // We need 0 -> 1 progress.
        // Let's try: We assume fixed speed. 
        // If we don't have progress, we use simple Z-axis simulation?
        // Server creates projectile. Server updates projectiles.
        // For now, let's stick to LINEAR for safety unless we rewrite server to send 't' (0.0 to 1.0).
        // Wait, 'cannonball' in clash royale arcs heavily.
        
        // Hack: Use distance from Target?
        // If proj has targetId, we can find target.
        // Let's default to LINEAR first to ensure stability, but ADD SHADOW below to fake height?
        
        // BETTER: Just render normally for now, but add Shadow offset.
        // If we want real arc, we need `progress` (0.0 to 1.0) from server.
        // Let's stick to flat visual but rotate properly.
    } 
    
    // ROTATION (Look at direction)
    // We need previous position to calculate angle? 
    // Or just compare to start if simplified?
    // Let's handle rotation in createVisual or here if we tracked prev pos.
    // For now, simple rotation for Arrows.
    if (proj.type.includes('arrow') || proj.type === 'spear') {
        const dx = proj.col - (container.prevCol ?? proj.startCol ?? 0);
        const dy = proj.row - (container.prevRow ?? proj.startRow ?? 0);
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
             // Invert Y because screen Y is opposite to grid row usually? 
             // unitToScreen handles it. Let's use screen delta.
             // But we need prev screen pos.
        }
        container.prevCol = proj.col;
        container.prevRow = proj.row;
    }

    container.x = x;
    container.y = y;
    
    // Rotation logic (Manual approximation)
    if (proj.type === 'spin_axe') {
        container.rotation += 0.5;
    }
  }
}

function createProjectileVisual(proj) {
  const container = new PIXI.Container();
  
  const key = proj.type + (proj.color ? "_" + proj.color : "");
  let texture = PROJ_TEXTURES.get(key);
  
  if (!texture) {
      const g = new PIXI.Graphics();
      const r = 20; // Ref size
      const color = proj.color || 0xFFFF00; // Default Yellow

      // === VISUALS VIA WEAPONS.js REUSE ===
      if (proj.type === 'fireball') {
           WEAPONS.magic_fire(g, r, {x:0, y:0}); // Ignores color usually
      }
      else if (proj.type === 'cannonball') {
           g.beginFill(0x000000); g.drawCircle(0,0,5); g.endFill();
      }
      else if (proj.type === 'bomb_drop') {
           WEAPONS.bomb_drop(g, r, {x:0, y:0});
      }
      else if (proj.type === 'arrow_ice') {
           WEAPONS.magic_ice(g, r, {x:0, y:0});
      }
      else if (proj.type === 'arrow_purple') {
           g.beginFill(0x9C27B0); g.drawPolygon([-5,-5, 5,-5, 0, 8]); g.endFill(); 
      }
      else if (proj.type === 'arrow_solaris') {
           g.beginFill(0xFFFF00); 
           g.drawPolygon([-4,-4, 4,-4, 0, 10]); 
           g.endFill(); 
           g.lineStyle(2, 0xFF9800, 0.5);
           g.drawCircle(0, 0, 5);
      }
      // [NEW] Generic Arrow / Spear with Custom Color
      else if (proj.type.includes('arrow') || proj.type === 'spear') {
           g.beginFill(color); 
           // Simple Arrowhead shape
           g.drawPolygon([-4,-4, 4,-4, 0, 12]); 
           g.endFill();
           
           // Glow effect if custom color
           if (proj.color) {
               g.lineStyle(2, color, 0.5);
               g.drawCircle(0, 0, 6);
           }
      }
      // [NEW] Default / Fallback
      else {
           g.beginFill(color); g.drawCircle(0,0,4); g.endFill();
           if (proj.color) {
               g.lineStyle(2, 0xFFFFFF, 0.5);
               g.drawCircle(0,0,6);
           }
      }

      texture = _app.renderer.generateTexture(g);
      PROJ_TEXTURES.set(key, texture);
  }

  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  container.addChild(sprite);

  // Scale adjustment
  sprite.scale.set((_grid.cellSize/40) * 1.5); // Make projectiles visible

  return container;
}