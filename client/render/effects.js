import { gameState } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";

const effectSprites = new Map();
let _app, _grid;

export function initEffects(app, grid) {
  _app = app;
  _grid = grid;

  const layer = new PIXI.Container();
  layer.zIndex = 100; // Paling atas (di atas unit)
  app.stage.addChild(layer);

  gameState.subscribe((state) => {
    // 1. Sync Standard Effects
    if (state.effects) syncEffects(state.effects, layer);
    
    // 2. [NEW] Sync Delayed Spells (Pending Circle)
    // We treat them as temporary effects or handle separate? 
    // Let's add them to the SAME layer but managed by syncPendingSpells
    if (state.delayedSpells) syncPendingSpells(state.delayedSpells, layer);
  });

  return { layer };
}

export function syncEffects(effects, layer) {
  const activeIds = new Set();

  effects.forEach(ef => {
    activeIds.add(ef.id);
    let gfx = effectSprites.get(ef.id);

    if (!gfx) {
      gfx = createEffectVisual(ef);
      effectSprites.set(ef.id, gfx);
      layer.addChild(gfx);
    }

    // UPDATE ANIMASI
    const pct = ef.time / ef.duration; // 1.0 -> 0.0 (Mundur)
    
    // Posisi
    const pos = unitToScreen(ef, _grid);
    gfx.x = pos.x;
    gfx.y = pos.y;
    
    // ANIMASI BERDASARKAN TIPE
    if (ef.type === 'explosion') {
        gfx.alpha = pct; 
        const scale = 1 + (1 - pct); 
        gfx.scale.set(scale);
    } 
    else if (ef.type === 'spin') {
        // Efek Valkyrie: Muter + Fade Out
        gfx.alpha = pct;
        gfx.rotation += 0.5; // Muter visualnya
    }
    else if (ef.type === 'shockwave') {
        // Efek Slam: Cepat hilang
        gfx.alpha = pct;
        const scale = 0.5 + (1 - pct) * 0.5; // Dari kecil membesar dikit
        gfx.scale.set(scale);
    }
    // [NEW] Lightning Animation (Flash)
    else if (ef.type === 'lightning_strike') {
        gfx.alpha = (pct > 0.5) ? 1 : 0.5; // Flicker
    }
    // [NEW] Buff Animation (Rise Up)
    else if (ef.type === 'buff_shine') {
        gfx.y -= (1 - pct) * 50; // Naik ke atas
        gfx.alpha = pct;
    }
  });

  // Cleanup
  for (const [id, gfx] of effectSprites) {
    if (!activeIds.has(id)) {
      gfx.destroy();
      effectSprites.delete(id);
    }
  }
}

function createEffectVisual(ef) {
  const gfx = new PIXI.Graphics();
  const color = ef.color || 0xFFFFFF; // [NEW] Custom Color Support

  if (ef.type === "explosion") {
    // [LAMA] Ledakan Api (Bomber/Ritual)
    gfx.beginFill(ef.color || 0xFF4500, 0.6); 
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
    gfx.endFill();
    gfx.lineStyle(4, 0xFFFF00, 1);
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
  }
  else if (ef.type === "spin") {
    // [BARU] Efek Putaran Valkyrie (Lingkaran angin/tebasan)
    // Warna Cyan Terang DEFAULT, atau Custom
    const c = ef.color || 0x00FFFF;
    
    gfx.lineStyle(4, c, 0.8);
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
    
    // Isi sedikit transparan
    gfx.beginFill(c, 0.2);
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
    gfx.endFill();

    // Tambah garis silang biar kelihatan muter
    gfx.lineStyle(2, 0xFFFFFF, 0.5);
    const r = ef.radius * _grid.cellSize;
    gfx.moveTo(-r, 0); gfx.lineTo(r, 0);
    gfx.moveTo(0, -r); gfx.lineTo(0, r);
  }
  else if (ef.type === "shockwave") {
    // [BARU] Efek Hentakan Tanah
    const c = ef.color || 0xFFFFFF;
    gfx.lineStyle(3, c, 1); // Ring Putih/Custom
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
    
    if (ef.color) {
        gfx.beginFill(c, 0.2);
        gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
        gfx.endFill();
    }
  }
  // [NEW] Visual Lightning
  else if (ef.type === "lightning_strike") {
    gfx.lineStyle(4, 0x00FFFF, 1); // Cyan Lightning
    gfx.moveTo(0, -600); // Start from sky
    gfx.lineTo(0, 0);   // Strike target
    
    // Opsional: Cabang petir
    gfx.lineStyle(2, 0xFFFFFF, 0.8);
    gfx.moveTo(0, -300);
    gfx.lineTo(30, -150);
    gfx.lineTo(0, 0); // ZigZag
    
    // Impact Flash
    gfx.beginFill(0xFFFFFF);
    gfx.drawCircle(0, 0, 20);
    gfx.endFill();
  }
  // [NEW] Visual Buff Shine
  else if (ef.type === "buff_shine") {
    gfx.beginFill(0xFFD700, 0.5); // Gold Shine
    // Manual Star Draw
    drawStar(gfx, 0, 0, 5, 30, 15);
    gfx.endFill();
  }
  // [NEW] Poison Cloud (Zone)
  else if (ef.type === "circle_zone" && ef.damage > 0) {
    gfx.beginFill(ef.color || 0x00FF00, 0.3); // Toxic Green DEFAULT
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
    gfx.endFill();
    // Smoke particles logic would go in syncEffects loop
  }
  // [NEW] Healing Ward (Zone)
  else if (ef.type === "circle_zone" && !ef.damage) {
    gfx.lineStyle(2, 0xFFFF00, 0.8);
    gfx.beginFill(0xFFFF00, 0.1); 
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
    gfx.endFill();
    
    // Cross Icon
    gfx.lineStyle(4, 0x00FF00, 1);
    gfx.moveTo(-10, 0); gfx.lineTo(10, 0);
    gfx.moveTo(0, -10); gfx.lineTo(0, 10);
  }

  return gfx;
}

// Helper Draw Star
function drawStar(g, x, y, points, outer, inner) {
    g.moveTo(x, y - outer);
    const step = Math.PI / points;
    for (let i = 0; i < 2 * points; i++) {
        const r = (i % 2 === 0) ? outer : inner;
        const a = Math.PI / 2 + i * step; // Start at top
        // Note: PIXI rotation is clockwise from right, so simple trig:
        // x = cos(angle), y = sin(angle)
        // But we want start top (angle - PI/2 if 0 is right)
        // Let's use standard star formula logic
        const angle = i * step;
        // Rotate -90 deg (top start)
        const rot = -Math.PI / 2;
        
        g.lineTo(
            x + Math.cos(angle + rot) * r,
            y + Math.sin(angle + rot) * r
        );
    }
    g.closePath();
}

const pendingSprites = new Map(); // [NEW] Map for Delayed Spells

function syncPendingSpells(delayedSpells, layer) {
    const activeIds = new Set(delayedSpells.map(ds => ds.id));

    // Cleanup
    for (const [id, gfx] of pendingSprites) {
        if (!activeIds.has(id)) {
            gfx.destroy();
            pendingSprites.delete(id);
        }
    }

    // Update / Create
    delayedSpells.forEach(ds => {
        let gfx = pendingSprites.get(ds.id);
        if (!gfx) {
            // Visualize Pending Spell (Circle on Ground)
            gfx = new PIXI.Graphics();
            pendingSprites.set(ds.id, gfx);
            layer.addChild(gfx);
        }

        // Draw Logic (Dynamic Timer)
        gfx.clear();
        
        const pos = unitToScreen(ds.targetPos, _grid);
        gfx.x = pos.x; 
        gfx.y = pos.y;

        const radius = ds.spell.radius * _grid.cellSize;
        const progress = ds.timer / ds.maxTimer; // 1.0 -> 0.0

        // Ground Ring
        gfx.lineStyle(2, 0xFFFFFF, 0.5);
        if (ds.teamId === 0) gfx.lineStyle(2, 0x00E676, 0.5); // Green (Ally)
        else gfx.lineStyle(2, 0xFF1744, 0.5); // Red (Enemy)

        gfx.drawCircle(0, 0, radius);

        // Shrinking Fill (Timer)
        gfx.beginFill(0xFFFFFF, 0.2);
        gfx.drawCircle(0, 0, radius * progress); 
        gfx.endFill();
    });
}
