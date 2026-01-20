import { gameState } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";
import { SOLARIS_THEME } from "./themes/solaris.js";
import { NOCTIS_THEME } from "./themes/noctis.js";
import { getUnitTexture } from "./visuals/generator.js";
import { updateUnitVisualEffects, initBuffIcons } from "./buff.js"; // Ganti nama file sesuai yg kamu simpan

const unitSprites = new Map();
const unitAnimations = new Map(); // Track animasi setiap unit
let _app, _grid;
let _animationTime = 0; // Global animation clock

export function initUnits(app, grid) {
  _app = app;
  _grid = grid;
  
  initBuffIcons(app);

  const layer = new PIXI.Container();
  layer.sortableChildren = true; // Agar unit tumpuk-menumpuk dengan benar (Y-sort)
  layer.zIndex = 10;
  app.stage.addChild(layer);

  // Add update untuk animasi
  app.ticker.add(() => {
    _animationTime += app.ticker.deltaMS / 1000; // Convert ke seconds
  });

  return { layer };
}

export function syncUnits(units, layer) {
  const activeIds = new Set();

  units.forEach(unit => {
    activeIds.add(unit.id);
    let container = unitSprites.get(unit.id);

    if (!container) {
      container = createUnitVisual(unit); // Lihat fungsi di bawah
      unitSprites.set(unit.id, container);
      unitAnimations.set(unit.id, {
        attackCooldown: 0,
        isAttacking: false,
        attackStartTime: 0,
        targetAngle: 0
      });
      layer.addChild(container);
    }

    // Update Posisi
    const pos = unitToScreen(unit, _grid);
    container.x = pos.x;
    container.y = pos.y;

    // [NEW] UPDATE VISUAL SCALE DARI RADIUS
    // Rumus: (Diameter Fisik Unit dalam Pixel) / (Ukuran Texture Asli)
    
    // 1. Ambil radius dari server (unit.radius)
    // 2. Konversi ke Pixel: radius * 2 (diameter) * cellSize
    const targetPixelSize = (unit.radius * 2) * _grid.cellSize;
    
    // 3. Texture referensi kita di generator.js radiusnya 20 (diameter 40)
    const textureRefSize = 40; 
    
    // 4. Set Scale
    const bodySprite = container.getChildByName("bodySprite");
    if (bodySprite) {
        bodySprite.scale.set(targetPixelSize / textureRefSize);
    }
    
    // Z-Index
    container.zIndex = Math.floor(container.y);

    // Update HP Bar
    updateHealthBar(container, unit);

    // [NEW] UPDATE ATTACK ANIMATION
    updateAttackAnimation(container, unit, unitAnimations.get(unit.id));

    // [NEW] UPDATE VISUAL BUFF/DEBUFF
    // Ini akan mewarnai unit dan menambah ikon status di atasnya
    updateUnitVisualEffects(container, unit); 
  });

  // Cleanup unit mati
  for (const [id, container] of unitSprites) {
    if (!activeIds.has(id)) {
      container.destroy();
      unitSprites.delete(id);
      unitAnimations.delete(id);
    }
  }
}

// [NEW] Fungsi untuk handle attack animation
function updateAttackAnimation(container, unit, animState) {
  const bodySprite = container.getChildByName("bodySprite");
  if (!bodySprite) return;

  // Cek apakah unit sedang attack (attackCooldown < 0 = sedang attack)
  const isCurrentlyAttacking = unit.attackCooldown && unit.attackCooldown < 0;

  // Transition: Jika mulai attack, set waktu mulai
  if (isCurrentlyAttacking && !animState.isAttacking) {
    animState.isAttacking = true;
    animState.attackStartTime = _animationTime;
  }

  // Jika selesai attack (attackCooldown > 0 atau = 0)
  if (!isCurrentlyAttacking && animState.isAttacking) {
    animState.isAttacking = false;
  }

  // ANIMATION LOGIC
  if (animState.isAttacking) {
    const timeSinceStart = _animationTime - animState.attackStartTime;
    const ATTACK_DURATION = 0.25; // 250ms attack animation

    if (timeSinceStart < ATTACK_DURATION) {
      // Attack phase: scale pulse + wobble
      const progress = timeSinceStart / ATTACK_DURATION; // 0 to 1
      
      // SCALE PULSE: 1.0 -> 1.15 -> 1.0
      const scaleFactor = 1.0 + Math.sin(progress * Math.PI) * 0.15;
      
      // Apply scale
      const baseScale = (_grid.cellSize * 0.8) / 40;
      bodySprite.scale.set(baseScale * scaleFactor);

      // OPTIONAL: Sedikit wobble/shake
      const wobble = Math.sin(progress * Math.PI * 3) * 2; // Small shake
      container.x = unitToScreen({ x: unit.x, y: unit.y }, _grid).x + wobble;
    } else {
      // Reset ke normal scale
      const baseScale = (_grid.cellSize * 0.8) / 40;
      bodySprite.scale.set(baseScale);
      
      // Reset position
      const pos = unitToScreen(unit, _grid);
      container.x = pos.x;
    }
  } else {
    // Normal state: reset scale
    const baseScale = (_grid.cellSize * 0.8) / 40;
    bodySprite.scale.set(baseScale);
    
    // Reset position
    const pos = unitToScreen(unit, _grid);
    container.x = pos.x;
  }
}

function createUnitVisual(unit) {
  const container = new PIXI.Container();

  // 1. Tentukan Faksi (Contoh logika simple dulu)
  // Nanti Anda bisa ambil dari gameState.players[unit.team].faction
  const factionName = unit.team === 0 ? 'solaris' : 'noctis';

  // 2. Generate Texture Prosedural!
  const texture = getUnitTexture(_app, unit.cardId, factionName);
  
  // 3. Buat Sprite
  const sprite = new PIXI.Sprite(texture);
  sprite.name = "bodySprite"; // Wajib untuk buff.js tinting
  sprite.anchor.set(0.5); 
  
  // Scale agar pas dengan grid
  const scale = (_grid.cellSize * 0.8) / 40; // 40 adalah diameter referensi (r=20)
  sprite.scale.set(scale);

  container.addChild(sprite);

  // 4. HP Bar (Sama)
  const barBg = new PIXI.Graphics();
  barBg.beginFill(0x000000);
  barBg.drawRect(-15, -30, 30, 6);
  barBg.endFill();
  container.addChild(barBg);

  const barFill = new PIXI.Graphics();
  barFill.name = "hpBar";
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