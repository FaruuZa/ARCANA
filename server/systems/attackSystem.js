import { distance } from "../utils/math.js";
import { createProjectile } from "../entity/projectile.js";
import { dealAreaDamage } from "../utils/combat.js";
import { applyBuff } from "../utils/combat.js";

export function updateAttacks(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings];

  for (const unit of units) {
    if (unit.hp <= 0) continue;

    if (unit.isStunned) {
      // Optional: Reset charge kalau kena stun?
      unit.isCharging = false;
      continue;
    }

    if (unit.isSilenced) {
      if (unit.isChannelingJump) unit.isChannelingJump = false; // Cancel skill
      if (unit.isCharging) unit.isCharging = false; // Cancel skill
    }

    // [FIX] JANGAN MENYERANG SAAT SEDANG LOMPAT/WINDUP
    // Biarkan movementSystem yang handle damage pendaratan Assassin
    if (unit.isJumping || unit.isChannelingJump) continue;

    // 0. Handle Spawning
    if (unit.state === "spawning") {
      unit.stateTimer -= dt;
      if (unit.stateTimer <= 0) unit.state = "moving";
      continue;
    }

    // 1. Manage Cooldown
    if (unit.attackCooldown > 0) unit.attackCooldown -= dt;

    // 2. STATE MACHINE Logic
    const intent = unit.intent;

    if (intent.type === "engage" && intent.targetId) {
      const target = allEntities.find((e) => e.id === intent.targetId);

      if (!target || target.hp <= 0) {
        unit.state = "moving";
      } else {
        const dist = distance(unit, target);

        // Cek Range
        if (dist <= unit.range + 0.5) {
          if (unit.state === "moving") {
            // === [FIX] CHARGE LOGIC UPDATE ===
            if (unit.isCharging && unit.traits.charge) {
              // BUG FIX: Jangan pukul dulu kalau belum nabrak!
              // Tunggu sampai jarak sangat dekat (Collision)
              if (dist <= 0.8) {
                unit.state = "attacking";
                performAttack(unit, target, gameState);
              } else {
                // Masih lari mendekat (Charging)...
                // Jangan masuk state 'pre_attack' agar movement tidak berhenti
                // Biarkan dia tetap di state 'moving'
              }
            } else {
              // Normal Attack Transition
              unit.state = "pre_attack";
              unit.stateTimer = unit.aimTime;
            }
          } else if (unit.state === "pre_attack") {
            unit.stateTimer -= dt;
            if (unit.stateTimer <= 0) unit.state = "attacking";
          } else if (unit.state === "attacking") {
            performAttack(unit, target, gameState);
          }
        } else {
          // Diluar Range
          unit.state = "moving";
          unit.stateTimer = 0;
        }
      }
    } else {
      unit.state = "moving";
    }
  }

  updateTowers(buildings, units, gameState, dt);
}

function performAttack(unit, target, gameState) {
  if (unit.attackCooldown <= 0) {
    const isRanged = !!unit.projectileType;

    // 1. Hitung Damage Dasar
    let actualDamage = unit.damage;
    let isCriticalCharge = false;

    // 2. Logic Charge (Kalkulasi Damage Tambahan)
    if (unit.isCharging && unit.traits.charge) {
      actualDamage *= unit.traits.charge.damageMult;
      isCriticalCharge = true;
      unit.isCharging = false;
      unit.chargeTimer = 0;
    }

    // 3. SIAPKAN DAFTAR BUFF (On-Hit Effects)
    // Kita kumpulkan dulu semua buff yang mungkin terjadi, tapi JANGAN diaplikasikan dulu.
    const onHitEffects = [];

    // A. Freeze / Slow Effect
    if (unit.traits.freezeOnHit) {
      onHitEffects.push({
        name: "frost_slow",
        type: "speed_mult",
        value: 0.6, // speed jadi 60% (40% slow)
        duration: 2.0,
        sourceId: unit.id
      });
      onHitEffects.push({
        name: "frost_chill",
        type: "attack_speed_mult",
        value: 0.8,               // Attack speed jadi 80% (20% slow)
        duration: 2.0,
        sourceId: unit.id
      });
    }

    // B. Contoh Trait Lain (misal Poison) - Mudah ditambah nanti
    if (unit.traits.poisonOnHit) {
      onHitEffects.push({
        name: "poison_dot",
        type: "poison",
        value: 5, // Damage per tick
        duration: 3.0,
        sourceId: unit.id
      });
    }

    if (unit.traits.stunOnHit) {
       onHitEffects.push({
         name: "bash_stun",
         type: "stun",            // Tipe: Stun
         value: 1,                // Value gak ngaruh buat stun
         duration: unit.traits.stunDuration || 0.5,
         sourceId: unit.id
       });
    }
    // === [BARU] ROOT LOGIC ===
    if (unit.traits.rootOnHit) {
        onHitEffects.push({
            name: "root_effect",
            type: "root",
            value: 1,
            duration: unit.traits.rootDuration || 1.0,
            sourceId: unit.id
        });
    }

    // === [BARU] SILENCE LOGIC (Untuk Witch Hunter) ===
    if (unit.traits.silenceOnHit) {
        onHitEffects.push({
            name: "silence_effect",
            type: "silence",
            value: 1,
            duration: unit.traits.silenceDuration || 3.0,
            sourceId: unit.id
        });
    }

    // 4. EKSEKUSI SERANGAN
    if (isRanged) {
      // [RANGED ATTACK]
      // Buff dikirim bersama peluru. Nanti sistem projectile yang akan applyBuff saat 'collision'.
      const proj = createProjectile({
        id: gameState.nextEntityId++,
        ownerId: unit.id,
        targetId: target.id,
        damage: actualDamage,
        team: unit.team,
        col: unit.col,
        row: unit.row,
        speed: 10.0,
        type: unit.projectileType || "arrow",
        aoeRadius: unit.aoeRadius || 0,
        targetHeight: unit.targetHeight,
        
        // [PENTING] Titipkan efek buff ke projectile
        onHitEffects: onHitEffects 
      });
      gameState.projectiles.push(proj);

    } else {
      // [MELEE ATTACK]
      // Serangan langsung kena (Instant)
      
      if (unit.aoeRadius > 0) {
        // [MELEE AOE]
        // Catatan: dealAreaDamage saat ini hanya mengurangi HP. 
        // Jika ingin buff kena area, dealAreaDamage perlu dimodifikasi untuk menerima 'onHitEffects'.
        // Untuk sekarang, kita biarkan damage area saja.
        
        const origin = (unit.aoeType === "self") ? unit : target;
        
        dealAreaDamage(
            gameState,
            origin,
            unit.aoeRadius,
            actualDamage,
            unit.team,
            unit.targetHeight,
            unit.targetTeam || 'enemy'
        );

        // Visual Effects AOE
        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: unit.aoeType === "self" ? "spin" : "shockwave",
            col: origin.col,
            row: origin.row,
            radius: unit.aoeRadius,
            duration: 0.3,
            time: 0.3,
        });

      } else {
        // [MELEE SINGLE TARGET]
        // 1. Deal Damage
        target.hp -= actualDamage;

        // 2. Apply Buffs (Hanya jika target masih hidup atau valid)
        // Disinilah trigger "ketika serangan berhasil ngehit" terjadi untuk melee.
        if (target.hp > 0 || !unit.traits.execute) { // execute logic opsional
            onHitEffects.forEach(effect => {
                applyBuff(target, effect);
            });
        }
      }

      // Efek Visual Charge Impact
      if (isCriticalCharge) {
        gameState.effects.push({
          id: gameState.nextEntityId++,
          type: "shockwave",
          col: target.col,
          row: target.row,
          radius: 1.0,
          duration: 0.2,
          time: 0.2,
        });
      }
    }

    unit.attackCooldown = 1.0 / unit.attackSpeed;
  }
}

function updateTowers(buildings, units, gameState, dt) {
  for (const tower of buildings) {
    if (tower.hp <= 0) continue;
    if (tower.attackCooldown > 0) tower.attackCooldown -= dt;

    if (tower.attackCooldown <= 0) {
      let target = null;
      let minDist = tower.range;
      for (const enemy of units) {
        if (enemy.team === tower.team) continue;
        if (enemy.hp <= 0) continue;
        const d = distance(tower, enemy);
        if (d <= minDist) {
          minDist = d;
          target = enemy;
        }
      }
      if (target) {
        const proj = createProjectile({
          id: gameState.nextEntityId++,
          ownerId: tower.id,
          targetId: target.id,
          damage: 15,
          team: tower.team,
          col: tower.col,
          row: tower.row,
          speed: 10.0,
          type: "cannonball",
        });
        gameState.projectiles.push(proj);
        tower.attackCooldown = 1.0;
      }
    }
  }
}
