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
    // [FIX REQUEST] Unit tampak terlalu kecil -> KITA BESARKAN 25-30%
    const SCALE_MULTIPLIER = 1.3; 
    
    const bodySprite = container.getChildByName("bodySprite");
    if (bodySprite) {
        bodySprite.scale.set((targetPixelSize / textureRefSize) * SCALE_MULTIPLIER);
    }
    
    // FLICKER GUARD (NaN CHECK)
    // Kadang interpolasi atau lag spike bikin coordinate NaN
    if (!isNaN(pos.x) && !isNaN(pos.y)) {
        container.x = pos.x;
        container.y = pos.y;
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
  const baseScale = bodySprite.scale.x; // Utilize current scale from main update (simplified)
  // Note: baseScale logic in syncUnits dominates, but we apply pulse on top.
  // Ideally, store base scale factor separately. 
  // For now we will just use 1.0 relative pulse on the sprite.
  
  if (animState.isAttacking) {
    const timeSinceStart = _animationTime - animState.attackStartTime;
    const ATTACK_DURATION = 0.25; // 250ms attack animation

    if (timeSinceStart < ATTACK_DURATION) {
      // Attack phase: scale pulse + wobble
      const progress = timeSinceStart / ATTACK_DURATION; // 0 to 1
      
      // SCALE PULSE: 1.0 -> 1.15 -> 1.0
      const pulse = 1.0 + Math.sin(progress * Math.PI) * 0.15;
      
      // Apply scale (Assume uniform scaling)
      bodySprite.scale.set(bodySprite.scale.x * pulse); // Recursive relative fix handled by next frame reset

      // OPTIONAL: Sedikit wobble/shake
      const wobble = Math.sin(progress * Math.PI * 3) * 2; // Small shake
      // Only apply wobble if position is valid
      if (!isNaN(container.x)) {
          // Note: accessing grid util again is expensive, better to offset container.x directly
          // We already set container.x in main loop. Just add offset here?
          // No, main loop overrides.
          // Correct approach: Modifier on container.x
          // Since main loop runs before this function (called inside syncUnits), we can mod x directly.
          container.x += wobble;
      }
    }
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
  const scale = (_grid.cellSize * 0.8) / 40; // Default fallback
  sprite.scale.set(scale);

  container.addChild(sprite);

  // 4. HP Bar Background
  const barBg = new PIXI.Graphics();
  barBg.name = "hpBarBg";
  // [FIX] Align BG and Fill correctly
  barBg.beginFill(0x000000);
  barBg.drawRect(-15, -35, 30, 6); // Raised slightly higher
  barBg.endFill();
  container.addChild(barBg);

  // HP Bar Fill
  const barFill = new PIXI.Graphics();
  barFill.name = "hpBar";
  container.addChild(barFill);
  
  // Shield Bar (Overheal)
  const shieldFill = new PIXI.Graphics();
  shieldFill.name = "shieldBar"; // For overheal
  container.addChild(shieldFill);

  return container;
}

function updateHealthBar(container, unit) {
  const barFill = container.getChildByName("hpBar");
  const shieldFill = container.getChildByName("shieldBar");
  const barBg = container.getChildByName("hpBarBg");
  
  if (!barFill || !shieldFill) return;

  const maxHp = unit.maxHp || 1;
  const currentHp = unit.hp;
  
  // Normal HP Percentage (max 1.0)
  let hpPct = Math.min(1.0, Math.max(0, currentHp / maxHp));
  
  // Shield Percentage (Overheal amount relative to Max HP)
  let shieldPct = 0;
  if (currentHp > maxHp) {
      shieldPct = Math.min(1.0, (currentHp - maxHp) / maxHp); // Cap shield display at +100% maxHP for safety
  }

  barFill.clear();
  shieldFill.clear();

  // Warna: Hijau (>50%) -> Kuning -> Merah (<25%)
  let color = 0x00FF00;
  if (hpPct < 0.5) color = 0xFFFF00;
  if (hpPct < 0.25) color = 0xFF0000;
  
  const BAR_W = 28; // width inside padding
  const BAR_X = -14;
  const BAR_Y = -34; // inside bg rect
  const BAR_H = 4;

  // Draw Normal HP
  barFill.beginFill(color);
  barFill.drawRect(BAR_X, BAR_Y, BAR_W * hpPct, BAR_H);
  barFill.endFill();
  
  // Draw Shield (White) - Overlays on top or extends? 
  // Request: "overheal menjadi shield (health warna putih)"
  // Interpretation: The portion exceeding max hp is white. 
  // If we just draw white over full bar, it implies shield.
  if (shieldPct > 0) {
      shieldFill.beginFill(0xFFFFFF);
      // Draw shield starting from where HP ends (which is full width)
      // BUT if the bar is fixed width, we can't extend it easily without looking weird backing.
      // Alternative: Draw white bar ON TOP of green bar to represent the 'extra' layer strength
      // OR: Re-paint the whole bar white if fully overhealed?
      // "hp melebihi maks hp menjadi shield"
      // Let's implement: The 'excess' is a white bar that replaces the health bar from left to right 
      // OR extends? Standard games often add a white overlay or extend the bar.
      // Since our bar background is fixed, let's overlay the white bar on the green bar
      // to show "Armored/Shielded" status, or make it a separate segment?
      // Let's try: Overheal replaces the green bar with white bar proportional to overheal amount?
      // No, that's confusing.
      // Simple approach: The surplus HP is drawn as a white bar starting from 0 (like a second layer)
      // representing "Shield Health".
      shieldFill.drawRect(BAR_X, BAR_Y, BAR_W * shieldPct, BAR_H);
      shieldFill.endFill();
  }
  
  // Visibility Logic
  const show = currentHp < maxHp || currentHp > maxHp; // Show if damaged OR overhealed
  
  if (barBg) barBg.visible = show;
  barFill.visible = show;
  shieldFill.visible = shieldPct > 0;
}