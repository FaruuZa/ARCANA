import { BLUEPRINTS } from "./visuals/blueprints.js";
import { updateUnitVisualEffects, initBuffIcons } from "./buff.js";
import { gameState } from "../state/gameState.js";
import { getUnitTexture } from "./visuals/generator.js";
import { unitToScreen } from "../utils/grid.js";

const unitSprites = new Map();
const unitAnimations = new Map();
let _app, _grid;
let _animationTime = 0;

export function initUnits(app, grid) {
  _app = app;
  _grid = grid;

  initBuffIcons(app);

  const layer = new PIXI.Container();
  layer.sortableChildren = true;
  layer.zIndex = 10;
  app.stage.addChild(layer);

  app.ticker.add(() => {
    _animationTime += app.ticker.deltaMS / 1000;
  });

  return { layer };
}

export function syncUnits(units, layer) {
  const activeIds = new Set();

  units.forEach(unit => {
    activeIds.add(unit.id);
    let container = unitSprites.get(unit.id);

    if (!container) {
      container = createUnitVisual(unit);
      unitSprites.set(unit.id, container);
      unitAnimations.set(unit.id, {
        lastCooldown: 0, // [FIX] Renamed from attackCooldown for clarity
        isAttacking: false,
        attackStartTime: 0,
        targetAngle: 0
      });
      layer.addChild(container);
    }

    // Update Posisi
    const pos = unitToScreen(unit, _grid);

    // FLICKER GUARD
    if (!isNaN(pos.x) && !isNaN(pos.y)) {
      container.x = pos.x;
      container.y = pos.y;
    }

    // [New] Base Scale Calculation from Blueprint
    // Blueprint scale is relative to the "standard size".
    // We combine Blueprint Scale * Grid Scale.
    const bp = BLUEPRINTS[unit.cardId] || BLUEPRINTS['default'];
    // Default size logic: radius * 2 * cellSize
    const targetPixelSize = (unit.radius * 2) * _grid.cellSize;

    const bodySprite = container.getChildByName("bodySprite");
    let textureRefSize = 40;

    if (bodySprite && bodySprite.texture && bodySprite.texture.valid) {
      // [FIX] Use actual texture width if loaded
      // If width is very small (1px placeholder), using it as divisor creates HUGE scale.
      // Treat everything < 32px as 'not yet loaded' or 'icon' and default to 40 for safety.
      const w = bodySprite.texture.width;
      textureRefSize = w > 32 ? w : 40;
    }

    // Final Scale = (TargetSize / RefSize)
    // [FIX] User Request: "sesuai dengan unit.radius masing bukan hardCoded"
    // Removed bp.scale multiplier to strictly adhere to physics radius.
    const visualScale = (targetPixelSize / textureRefSize);

    if (bodySprite) {
      // Store base scale for animation reference
      container.baseScale = visualScale;

      // Only apply if NOT animating (Animation overrides scale)
      // Check if attacking? No, updateAttackAnimation handles it.
      // But we must reset if NOT attacking to ensure scale is correct.
      // updateAttackAnimation does reset at end.

      const anim = unitAnimations.get(unit.id);
      if (!anim || !anim.isAttacking) {
        bodySprite.scale.set(visualScale);
      }
    }

    container.zIndex = Math.floor(container.y);

    updateHealthBar(container, unit);
    updateAttackAnimation(container, unit, unitAnimations.get(unit.id));
    updateUnitVisualEffects(container, unit);
    updateAuraVisuals(container, unit, _grid.cellSize); // [NEW] Aura
  });

  // Cleanup
  for (const [id, container] of unitSprites) {
    if (!activeIds.has(id)) {
      container.destroy();
      unitSprites.delete(id);
      unitAnimations.delete(id);
    }
  }
}

function updateAttackAnimation(container, unit, animState) {
  const bodySprite = container.getChildByName("bodySprite");
  if (!bodySprite) return;

  // 1. Detect Attack Trigger
  // Server resets attackCooldown to (1/AS) when attack fires.
  // We detect if cooldown INCREASED significantly (reset).
  const currentCooldown = unit.attackCooldown || 0;
  const lastCooldown = animState.lastCooldown || 0;

  // Threshold 0.1 prevents jitter, ensures it's a reset
  if (currentCooldown > lastCooldown + 0.1) {
    animState.isAttacking = true;
    animState.attackStartTime = _animationTime;

    // 2. Resolve Target Angle (Visual Lunge Direction)
    // Default Direction Logic:
    // If Unit is MY Team (always at Bottom visually) -> Default Lunge UP (-PI/2)
    // If Unit is ENEMY Team (always at Top visually) -> Default Lunge DOWN (+PI/2)
    const myTeamId = gameState.getMyTeam();
    const isFriendly = (unit.team === myTeamId);

    animState.targetAngle = isFriendly ? -Math.PI / 2 : Math.PI / 2;

    if (unit.intent && unit.intent.targetId) {
      const targetId = unit.intent.targetId;
      // Search in local gameState replica
      const t = gameState.units.find(u => u.id === targetId) || gameState.buildings.find(b => b.id === targetId);

      if (t) {
        const myPos = unitToScreen(unit, _grid);
        const targetPos = unitToScreen(t, _grid);

        // Calculate screen-space angle
        if (myPos && targetPos) {
          animState.targetAngle = Math.atan2(targetPos.y - myPos.y, targetPos.x - myPos.x);
        }
      }
    }
  }

  // Update Tracking State
  animState.lastCooldown = currentCooldown;

  // 3. Handle Animation Execution
  if (animState.isAttacking) {
    const timeSinceStart = _animationTime - animState.attackStartTime;
    const ATTACK_DURATION = 0.3; // Standard visual duration (0.3s)

    if (timeSinceStart < ATTACK_DURATION) {
      const progress = timeSinceStart / ATTACK_DURATION; // 0.0 to 1.0

      const baseScale = container.baseScale || 1.0;
      // Distinguish Melee vs Ranged
      // weaponType stored in container during creation
      // Check typical ranged weapons
      const isRanged = ['bow', 'musket', 'rifle', 'rifle_long', 'magic_fire', 'magic_ice', 'magic_zap', 'bomb_drop', 'cannon_ball'].includes(container.weaponType);

      let scaleMult = 1.0;
      let offsetX = 0;
      let offsetY = 0;

      if (isRanged) {
        // === RANGED ANIMATION (Recoil) ===
        // 0.0 -> 0.2: Quick Shrink/Recoil
        // 0.2 -> 1.0: Recover
        if (progress < 0.2) {
          scaleMult = 1.0 - (progress * 0.5); // Shrink to ~0.9
        } else {
          scaleMult = 0.9 + ((progress - 0.2) * 0.125); // Back to 1.0
        }

        // Simple shake (no direction)
        offsetX = Math.sin(progress * Math.PI * 10) * 2;

      } else {
        // === MELEE ANIMATION (Lunge) ===
        // 1. Move Body towards target (Sine wave: 0 -> Max -> 0)
        // Peak at 0.3 (30%) of animation
        const lungePhase = Math.sin(progress * Math.PI);
        const lungeDist = (_grid.cellSize * 0.4) * lungePhase; // Lunge 40% of cell size

        offsetX = Math.cos(animState.targetAngle) * lungeDist;
        offsetY = Math.sin(animState.targetAngle) * lungeDist;

        // 2. Slight Scale Bump (Impact)
        scaleMult = 1.0 + (lungePhase * 0.1);
      }

      // Apply Transformations
      bodySprite.scale.set(baseScale * scaleMult);

      // Apply Position Offset to BodySprite (relative to container center)
      bodySprite.x = offsetX;
      bodySprite.y = offsetY;

    } else {
      // Animation Finished
      animState.isAttacking = false;

      // Reset Visuals
      const baseScale = container.baseScale || 1.0;
      bodySprite.scale.set(baseScale);
      bodySprite.x = 0;
      bodySprite.y = 0;
    }
  }
}

function createUnitVisual(unit) {
  const container = new PIXI.Container();

  // 1. Tentukan Faksi dari Player Data
  let factionName = 'neutral';
  if (gameState.players && gameState.players[unit.team]) {
    factionName = gameState.players[unit.team].faction || (unit.team === 0 ? 'solaris' : 'noctis');
  } else {
    factionName = unit.team === 0 ? 'solaris' : 'noctis'; // Fallback
  }

  const texture = getUnitTexture(_app, unit.cardId, factionName);

  // Store Weapon Type for Animation
  const bp = BLUEPRINTS[unit.cardId] || BLUEPRINTS['default'];
  container.weaponType = bp.weapon || 'none';

  const sprite = new PIXI.Sprite(texture);
  sprite.name = "bodySprite";
  sprite.anchor.set(0.5);

  container.addChild(sprite);

  // ... bars (same as before) ...
  const barBg = new PIXI.Graphics();
  barBg.name = "hpBarBg";
  barBg.beginFill(0x000000);
  barBg.drawRect(-15, -35, 30, 6);
  barBg.endFill();
  container.addChild(barBg);

  const barFill = new PIXI.Graphics();
  barFill.name = "hpBar";
  container.addChild(barFill);

  const shieldFill = new PIXI.Graphics();
  shieldFill.name = "shieldBar";
  container.addChild(shieldFill);

  // [NEW] Outline Graphics (Initially hidden)
  const outline = new PIXI.Graphics();
  outline.name = "outline";
  container.addChildAt(outline, 0);

  // [NEW] Aura Graphics
  const aura = new PIXI.Graphics();
  aura.name = "aura";
  container.addChildAt(aura, 0); // Paling belakang

  return container;
}

function updateAuraVisuals(container, unit, cellSize) {
  const aura = container.getChildByName("aura");
  if (!aura) return;

  // Clear previous frame
  aura.clear();

  // Check if unit has aura trait
  if (unit.traits && unit.traits.aura && !unit.isSilenced) {
    const radius = unit.traits.aura.radius * cellSize;

    // Determine Color
    // Priority: Custom Color > Buff Type
    let color = 0xFFD700; // Default Gold
    let alpha = 0.15;

    if (unit.traits.aura.color) {
      color = unit.traits.aura.color;
    } else {
      // Infer from buff type if possible
      const buffs = unit.traits.aura.buffs || [];
      if (buffs.length > 0) {
        const type = buffs[0].type;
        if (type === 'regen' || type === 'heal') color = 0x00FF00;
        else if (type.includes('damage')) color = 0xFF0000;
        else if (type === 'speed_mult' && buffs[0].value > 1) color = 0x00FFFF;
        else if (type === 'defense' || type === 'shield') color = 0x0000FF;
      }
    }

    // Draw Aura Circle
    aura.beginFill(color, alpha);
    aura.drawCircle(0, 0, radius);
    aura.endFill();

    // Border
    aura.lineStyle(2, color, 0.5);
    aura.drawCircle(0, 0, radius);

    // Optional: Pulse Animation based on time?
    // We can use container.scale or just simple static for now to save perf
  }
}

// === API PUBLIC UNTUK INPUT SYSTEM ===
export function setUnitOutline(unitId, colorType) {
  const container = unitSprites.get(unitId);
  if (!container) return;

  const outline = container.getChildByName("outline");
  if (!outline) return;

  outline.clear();

  if (!colorType) return; // Clear outline

  const radius = 20; // Approx texture radius (40px / 2)
  // Scale outline with unit scale
  const scale = container.getChildByName("bodySprite").scale.x;
  const r = radius * scale * 1.2; // Sedikit lebih besar dari body

  if (colorType === 'white') {
    // Valid Target Indicator
    outline.lineStyle(2, 0xFFFFFF, 0.8);
    outline.drawCircle(0, 0, r);
  } else if (colorType === 'green') {
    // Selected Target Indicator
    outline.lineStyle(3, 0x00FF00, 1.0);
    outline.drawCircle(0, 0, r);

    // Glow Effect
    outline.beginFill(0x00FF00, 0.2);
    outline.drawCircle(0, 0, r);
    outline.endFill();
  }
}
// Export unitSprites container getter for strict collision check if needed
// Export unitSprites container getter for strict collision check if needed
export function getUnitScreenPosition(unitId) {
  const c = unitSprites.get(unitId);
  if (!c) return null;

  // [FIX] Convert Local/Stage Coords to Screen Global Coords
  // Because mouse events are Screen Coordinates
  const globalPos = c.getGlobalPosition();
  return { x: globalPos.x, y: globalPos.y };
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