import { FACTION_PALETTES, getFactionPalette } from "./themes.js";
import { BLUEPRINTS } from "./blueprints.js";
import { BODIES } from "./parts/bodies.js";
import { HEADS } from "./parts/heads.js";
import { WEAPONS } from "./parts/weapons.js";

const TEXTURE_CACHE = new Map();

/**
 * Membuat Texture unit secara prosedural.
 * @param {PIXI.Application} app 
 * @param {string} cardId - ID kartu (misal: 'vessel_hammer')
 * @param {string} factionName - Nama faksi (misal: 'solaris', 'noctis')
 */
export function getUnitTexture(app, cardId, factionName) {
  // 1. Cek Cache (Agar hemat memori)
  const cacheKey = `${cardId}_${factionName}`;
  if (TEXTURE_CACHE.has(cacheKey)) {
    return TEXTURE_CACHE.get(cacheKey);
  }

  // 2. Ambil Data
  const blueprint = BLUEPRINTS[cardId] || BLUEPRINTS['default'];
  const palette = getFactionPalette(factionName);
  const r = 20; // Radius standar referensi gambar

  // 3. Render ke Container
  const container = new PIXI.Container();
  const g = new PIXI.Graphics();
  container.addChild(g);

  // A. Render BODY
  const bodyFn = BODIES[blueprint.body] || BODIES['default'];
  bodyFn(g, r, palette.primary);

  // B. Render HEAD
  const headFn = HEADS[blueprint.head] || HEADS['default'];
  headFn(g, r, palette.primary);

  // C. Render WEAPON (Gunakan warna secondary faksi)
  const wepFn = WEAPONS[blueprint.weapon] || WEAPONS['none'];
  wepFn(g, r, palette.secondary);

  // 4. Generate Texture dari Graphics
  // Padding +2 agar stroke tidak terpotong
  const texture = app.renderer.generateTexture(container, {
    scaleMode: PIXI.SCALE_MODES.NEAREST, // Pixel art style, atau LINEAR untuk halus
    resolution: 2, // High DPI
  });

  // 5. Simpan Cache
  TEXTURE_CACHE.set(cacheKey, texture);

  return texture;
}