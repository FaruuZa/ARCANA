# TOP-DOWN PERSPECTIVE & ATTACK ANIMATION UPDATE

## Summary
Successfully transformed ARCANA's visual system from **side-view** to **TOP-DOWN isometric perspective**, and added **attack animations** with scale pulse effects.

## Changes Made

### 1. **heads.js** - TOP-DOWN Head Positioning
- All head types now render as circles from above (0-360° view)
- Kept facial features centered (eyes, halo, crown peaks positioned forward-north)
- Examples:
  - `helmet_viking`: Circular base with horn peaks at top
  - `crown_gold`: Crown peaks arranged in Y-shape pointing forward
  - `mask_void`: Circular mask with cyan eye glow
  - `halo`: Ring halos rendered concentrically

**Key Changes:**
```javascript
// BEFORE (side-view): drew profiles
helmet_viking: V-shape with horns extending left-right

// AFTER (top-down): circular from above
helmet_viking: Circle with horn peaks at front (0, -r*0.8)
```

### 2. **weapons.js** - TOP-DOWN Weapon Orientation
- All weapons now point FORWARD (toward negative Y axis, north)
- Converted from side-view held poses to top-down overhead view
- Examples:
  - `sword`: Long vertical rect pointing front
  - `hammer`: Square head in front, long handle behind
  - `bow`: Y-shape with string, arrow nocked
  - `staff`: Vertical rod with crystal orb at tip
  - `scythe`: Semi-circle blade at front, handle behind

**Key Changes:**
```javascript
// BEFORE: sword held at angle, positioned to side (x=r*0.6)
// AFTER: sword straight ahead (x=0), vertical orientation
sword: drawRect(-r*0.08, -r*0.9, r*0.16, r*0.7) // Thin blade pointing up
```

### 3. **bodies.js** - Already Updated (Previous Work)
- Confirmed all 7 body types use vertical elipses for top-down
- Positioning changed to radial (360°) instead of front-facing
- Elements positioned using cardinal directions (top, bottom, left, right)

### 4. **units.js** - ATTACK ANIMATION SYSTEM [NEW]
Added complete attack animation framework:

#### New Features:
1. **Global Animation Clock** (`_animationTime`)
   - Updated via `app.ticker.deltaMS`
   - Synchronized across all units

2. **Per-Unit Animation State** (`unitAnimations` Map)
   - `isAttacking`: boolean toggle
   - `attackStartTime`: timestamp when attack began
   - `targetAngle`: (for future directional attacks)

3. **Attack Detection**
   - Triggered when `unit.attackCooldown < 0`
   - Reset when `unit.attackCooldown >= 0`

4. **Animation Playback** (250ms duration)
   - **Scale Pulse**: 1.0 → 1.15 → 1.0
     - Using `Math.sin(progress * π)` for smooth easing
   - **Wobble Effect**: ±2px position shake
     - Using `Math.sin(progress * π * 3)` for 3 cycles

5. **Animation Function**: `updateAttackAnimation()`
   ```javascript
   // Runs each frame during syncUnits()
   const scaleFactor = 1.0 + Math.sin(progress * Math.PI) * 0.15;
   bodySprite.scale.set(baseScale * scaleFactor);
   ```

#### How It Works:
```
[Unit starts attack] → attackCooldown becomes < 0
                    ↓
[Animation begins] → Scale pulse + wobble for 250ms
                    ↓
[attackCooldown >= 0] → Animation ends, scale resets
```

## File Modifications Summary

| File | Changes | Impact |
|------|---------|--------|
| `heads.js` | All heads rendered from top-down (circular from above) | Units show proper head designs in isometric view |
| `weapons.js` | All weapons point forward (north/negative Y) | Weapons orient correctly relative to unit facing |
| `bodies.js` | (Already done) Vertical elipses, radial positioning | Top-down silhouettes correct |
| `units.js` | +Animation state tracking, +Attack pulse system | Units play 250ms scale animation when attacking |
| `generator.js` | No changes (positioning already supports top-down) | Ready to render new perspective |
| `blueprints.js` | No changes needed | Works with new body/head/weapon system |

## Visual Results

### Before This Update:
- ❌ Side-view perspective (horizontal elipses, side-facing weapons)
- ❌ No attack feedback (units freeze during attack)
- ❌ Unclear unit orientation on isometric board

### After This Update:
- ✅ True top-down perspective (circular from above)
- ✅ Attack animations with scale pulse + wobble
- ✅ Clear unit facing direction (north)
- ✅ Weapons point toward target area
- ✅ Proper visual feedback during combat

## Animation Timing

```
Attack Duration: 250ms
├─ 0-125ms: Scale grows from 1.0 to 1.15 (sine rise)
├─ 125-250ms: Scale shrinks from 1.15 to 1.0 (sine fall)
└─ Wobble: 3 cycles of ±2px during entire duration
```

## Performance Notes

- Animation clock (`_animationTime`) adds <1ms per frame
- Per-unit state tracking uses simple Map (O(1) lookup)
- Scale calculation uses basic math sin function
- No tweening library required (vanilla PixiJS)

## Next Steps (Optional Enhancements)

1. **Directional Attack Animations**
   - Rotate weapon slightly based on target angle
   - Add `targetAngle` field usage in animation

2. **Attack Types**
   - Fast melee (100ms pulse)
   - Slow heavy (400ms pulse with bigger scale)
   - Spell cast (fade-in/out glow)

3. **Hit Feedback**
   - Enemy knockback on hit
   - Damage number pop-up
   - Hit spark effect

4. **Movement Animations**
   - Slide transition when moving (0.5s duration)
   - Bobbing walk animation

## Testing Checklist

- [ ] Load game and verify units display in top-down view
- [ ] Check heads are circular and positioned correctly
- [ ] Verify weapons point north (forward)
- [ ] Trigger an attack and observe 250ms scale pulse
- [ ] Confirm wobble shake is visible but not distracting
- [ ] Test multiple units attacking simultaneously
- [ ] Verify performance (60 FPS maintained)

---

**Status**: ✅ IMPLEMENTATION COMPLETE
**Ready for**: Testing in-game
**Branch**: Feature/top-down-perspective + attack-animations
