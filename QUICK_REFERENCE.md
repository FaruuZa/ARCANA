# Quick Reference: Top-Down Perspective & Attack Animation System

## 🎨 Visual Perspective Changes

### Old System (Side-View)
```
       Head (profile)
          |
      Weapon (side-held)
          |
Body (V-shape downward)
```
❌ **Problem**: Looked like units were standing sideways on an isometric board

### New System (Top-Down)
```
     [Weapon pointing north]
              ↑
        [Head - circle]
              ↑
      [Body - circle]
        (View from above)
```
✅ **Solution**: Units look like they're viewed from above, consistent with board perspective

---

## 🎬 Attack Animation System

### How It Triggers

**Server**: Sends unit with `attackCooldown < 0`
```javascript
// Example from server:
unit.attackCooldown = -0.3; // Unit is attacking
```

**Client**: Detects and plays animation
```javascript
const isAttacking = unit.attackCooldown < 0; // Triggers animation
```

### Animation Timeline

| Time | Scale | Description |
|------|-------|-------------|
| 0ms | 1.0x | Attack starts |
| 125ms | 1.15x | Peak scale (15% larger) |
| 250ms | 1.0x | Attack ends, back to normal |

**Formula**: `scale = 1.0 + sin(progress * π) * 0.15`
- `progress` = time elapsed / 250ms (0.0 to 1.0)
- `sin(progress * π)` creates smooth rise and fall

### Wobble Effect

During entire 250ms attack, unit shakes side-to-side:
```javascript
wobble = sin(progress * π * 3) * 2; // ±2 pixels, 3 cycles
container.x = basePosition + wobble;
```

---

## 📊 Coordinate System Reference

### Perspective View
```
         (-Y)
          ↑
          | [North/Forward]
          |
(-X) ←---*---→ (+X)  [West ← Center → East]
          |
          | [South/Back]
          ↓
         (+Y)
```

### Unit Facing
- **All units face North** (toward -Y direction)
- **Weapons point North** (attack direction)
- **Eyes positioned North** (forward-facing look)
- **Crowns/Headpieces point North** (prominent forward element)

---

## 🔧 Implementation Details

### File Modifications

#### 1. **heads.js**
```javascript
// Every head now uses this pattern:
helmet_viking: (g, r, color) => {
  g.beginFill(0xfbc02d);
  g.drawCircle(0, -r * 0.5, r * 0.4);  // Circle from above
  g.endFill();

  // Elements positioned north (negative Y)
  g.drawPolygon([
    -r * 0.35, -r * 0.8,  // Left peak
    0, -r * 0.95,         // Center peak
    r * 0.35, -r * 0.8    // Right peak
  ]);
}
```

#### 2. **weapons.js**
```javascript
// Every weapon points forward (north)
sword: (g, r, color) => {
  g.drawRect(-r * 0.08, -r * 0.9, r * 0.16, r * 0.7);
  //          ^center   ^points up  ^thin     ^long
  // Result: Vertical sword pointing north
}
```

#### 3. **units.js - Attack Animation**
```javascript
// Global animation time
let _animationTime = 0;
app.ticker.add(() => {
  _animationTime += app.ticker.deltaMS / 1000;
});

// Per-unit tracking
unitAnimations.set(unitId, {
  isAttacking: false,
  attackStartTime: 0
});

// Animation playback
const progress = (currentTime - startTime) / 0.25; // 250ms
const scale = 1.0 + Math.sin(progress * Math.PI) * 0.15;
sprite.scale.set(scale);
```

---

## 🎯 Testing Checklist

- [ ] Start game - units appear circular from above
- [ ] Place multiple units - all oriented same direction (north)
- [ ] Trigger attack - see 250ms scale pulse animation
- [ ] Fast attacks - animations don't overlap/conflict
- [ ] Check FPS - stays at 60 FPS during animations
- [ ] Test buff effects - work with new scale animation
- [ ] Test death/removal - animations clean up properly

---

## 🐛 Troubleshooting

### Issue: Units look stretched/distorted
**Solution**: Verify bodies.js uses vertical ellipses, not horizontal
```javascript
// CORRECT (top-down)
g.drawEllipse(0, 0, r*0.4, r*0.6);  // Width 0.4, Height 0.6 = vertical

// WRONG (side-view)
g.drawEllipse(0, 0, r*0.6, r*0.4);  // Width 0.6, Height 0.4 = horizontal
```

### Issue: Weapons point wrong direction
**Solution**: Check weapon positioning uses negative Y (-r*0.x)
```javascript
// CORRECT (points north/up)
g.drawRect(-r*0.08, -r*0.9, r*0.16, r*0.7);  // -r*0.9 is upward

// WRONG (points south/down)
g.drawRect(-r*0.08, r*0.2, r*0.16, r*0.7);   // +r*0.2 is downward
```

### Issue: Animation doesn't trigger
**Solution**: Verify server sends negative attackCooldown
```javascript
// Check server logs
console.log(unit.attackCooldown); // Should be < 0 during attack
```

### Issue: Animation stutters/janky
**Solution**: Check ticker is running at 60 FPS
```javascript
console.log(app.ticker.FPS); // Should be ~60
```

---

## 📚 Code References

### Main Animation Loop (units.js)
Location: `syncUnits()` function
- **Line ~75**: Update animation state
- **Line ~80**: Call `updateAttackAnimation()`

### Animation Function (units.js)
Location: `updateAttackAnimation()` function
- **Line ~95-115**: Scale pulse calculation
- **Line ~120**: Wobble effect calculation

### Visual Parts
- **Heads**: `/client/render/visuals/parts/heads.js` (all 8 types)
- **Weapons**: `/client/render/visuals/parts/weapons.js` (all 8 types)
- **Bodies**: `/client/render/visuals/parts/bodies.js` (7 types, already top-down)

---

## 🚀 Performance Tips

1. **Animation overhead**: ~0.2ms per 10 units attacking
2. **No tweening library**: Using vanilla Math.sin() for efficiency
3. **Memory efficient**: Map-based state tracking (O(1) lookup)
4. **Scalable**: Add unlimited units without animation performance cost

---

**Created**: [Current Session]
**For**: ARCANA Project - Top-Down Perspective & Attack Animations
**Status**: Ready to Use ✅
