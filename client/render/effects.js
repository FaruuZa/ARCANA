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
  return { layer };
}

export function syncEffects(effects, layer) {
  const activeIds = new Set();

  effects.forEach((ef) => {
    activeIds.add(ef.id);
    let gfx = effectSprites.get(ef.id);

    if (!gfx) {
      gfx = createEffectVisual(ef);
      effectSprites.set(ef.id, gfx);
      layer.addChild(gfx);
    }

    // Update (Animasi Fade Out)
    // Server mengirim sisa waktu di `ef.time` dan total `ef.duration`
    const pct = ef.time / ef.duration;
    gfx.alpha = pct; // Makin lama makin transparan

    // Posisi (Static, tapi perlu dikonversi sekali saja atau tiap frame kalau camera gerak)
    const pos = unitToScreen(ef, _grid);
    gfx.x = pos.x;
    gfx.y = pos.y;

    // Scale up effect (Ledakan membesar)
    const scale = 1 + (1 - pct); // Dari 1x ke 2x
    gfx.scale.set(scale);
  });

  // Cleanup effect yang sudah hilang dari server
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
    // Lingkaran Merah/Oranye
    gfx.beginFill(0xff4500, 0.6); // Oranye Transparan
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
    gfx.endFill();

    // Ring Luar
    gfx.lineStyle(4, 0xffff00, 1);
    gfx.drawCircle(0, 0, ef.radius * _grid.cellSize);
  }

  return gfx;
}
