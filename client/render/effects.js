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
    if (!state.effects) return;
    syncEffects(state.effects, layer);
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

  if (ef.type === "explosion") {
    // [LAMA] Ledakan Api (Bomber/Ritual)
    gfx.beginFill(0xFF4500, 0.6); 
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
    gfx.endFill();
    gfx.lineStyle(4, 0xFFFF00, 1);
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
  }
  else if (ef.type === "spin") {
    // [BARU] Efek Putaran Valkyrie (Lingkaran angin/tebasan)
    // Warna Cyan Terang
    gfx.lineStyle(4, 0x00FFFF, 0.8);
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
    
    // Isi sedikit transparan
    gfx.beginFill(0x00FFFF, 0.2);
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
    gfx.lineStyle(3, 0xFFFFFF, 1); // Ring Putih
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
  }

  return gfx;
}
