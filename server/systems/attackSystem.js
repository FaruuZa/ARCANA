import { distance } from "../utils/math.js";
import { createProjectile } from "../entity/projectile.js";
import { dealAreaDamage } from "../utils/combat.js";
import { applyBuff } from "../utils/combat.js";
import { getOmenMultiplier } from "./omenSystem.js"; // [NEW]

export function updateAttacks(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings];
  
  const dmgMult = getOmenMultiplier(gameState, "damage");
  const asMult = getOmenMultiplier(gameState, "attack_speed");

  for (const unit of units) {
    if (unit.hp <= 0) continue;

    if (unit.isStunned) {
      unit.isCharging = false;
      continue;
    }

    if (unit.isSilenced) {
      if (unit.isChannelingJump) unit.isChannelingJump = false; 
      if (unit.isCharging) unit.isCharging = false; 
    }

    if (unit.isJumping || unit.isChannelingJump) continue;

    if (unit.state === "spawning") {
      unit.stateTimer -= dt;
      if (unit.stateTimer <= 0) unit.state = "moving";
      continue;
    }

    if (unit.attackCooldown > 0) unit.attackCooldown -= dt;

    const intent = unit.intent;

    if (intent.type === "engage" && intent.targetId) {
      const target = allEntities.find((e) => e.id === intent.targetId);

      if (!target || target.hp <= 0) {
        unit.state = "moving";
      } else {
        const dist = distance(unit, target);

        if (dist <= unit.range + 0.5) {
          if (unit.state === "moving") {
            if (unit.isCharging && unit.traits.charge) {
              if (dist <= 0.8) {
                unit.state = "attacking";
                performAttack(unit, target, gameState, dmgMult); // [FIX] Pass dmgMult
              }
            } else {
              unit.state = "pre_attack";
              unit.stateTimer = unit.aimTime;
            }
          } else if (unit.state === "pre_attack") {
            unit.stateTimer -= dt;
            if (unit.stateTimer <= 0) unit.state = "attacking";
          } else if (unit.state === "attacking") {
            performAttack(unit, target, gameState, dmgMult); // [FIX] Pass dmgMult
          }
        } else {
          unit.state = "moving";
          unit.stateTimer = 0;
        }
      }
    } else {
      unit.state = "moving";
    }
  }

  updateTowers(buildings, units, gameState, dt, dmgMult, asMult); // [FIX] Pass modifiers
}


function performAttack(unit, target, gameState, dmgMult, asMult = 1.0) {
  if (unit.attackCooldown <= 0) {
    const isRanged = !!unit.projectileType;

    // 1. Hitung Damage Dasar (Apply Omen)
    let actualDamage = unit.damage * dmgMult;
    let isCriticalCharge = false;

    if (unit.isCharging && unit.traits.charge) {
      actualDamage *= unit.traits.charge.damageMult;
      isCriticalCharge = true;
      unit.isCharging = false;
      unit.chargeTimer = 0;
    }

    const onHitEffects = [];

    if (unit.traits.freezeOnHit) {
      onHitEffects.push({
        name: "frost_slow",
        type: "speed_mult",
        value: 0.6,
        duration: 2.0,
        sourceId: unit.id
      });
      onHitEffects.push({
        name: "frost_chill",
        type: "attack_speed_mult",
        value: 0.8,
        duration: 2.0,
        sourceId: unit.id
      });
    }

    if (unit.traits.poisonOnHit) {
      onHitEffects.push({
        name: "poison_dot",
        type: "poison",
        value: 5,
        duration: 3.0,
        sourceId: unit.id
      });
    }

    if (unit.traits.stunOnHit) {
       onHitEffects.push({
         name: "bash_stun",
         type: "stun",
         value: 1,
         duration: unit.traits.stunDuration || 0.5,
         sourceId: unit.id
       });
    }
   
    if (unit.traits.rootOnHit) {
        onHitEffects.push({
            name: "root_effect",
            type: "root",
            value: 1,
            duration: unit.traits.rootDuration || 1.0,
            sourceId: unit.id
        });
    }

    if (unit.traits.silenceOnHit) {
        onHitEffects.push({
            name: "silence_effect",
            type: "silence",
            value: 1,
            duration: unit.traits.silenceDuration || 3.0,
            sourceId: unit.id
        });
    }

    if (isRanged) {
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
        onHitEffects: onHitEffects 
      });
      gameState.projectiles.push(proj);

    } else {
      if (unit.aoeRadius > 0) {
        const origin = (unit.aoeType === "self") ? unit : target;
        
        dealAreaDamage(
            gameState,
            origin,
            unit.aoeRadius,
            actualDamage,
            unit.team,
            unit.targetHeight,
            unit.targetTeam || 'enemy',
            onHitEffects
        );

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
        target.hp -= actualDamage;

        if (target.hp > 0 || !unit.traits.execute) { 
            onHitEffects.forEach(effect => {
                applyBuff(target, effect);
            });
        }
      }

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

    // [FIX] Apply Omen Attack Speed Modifier to Cooldown
    unit.attackCooldown = 1.0 / (unit.attackSpeed * asMult);
  }
}

function updateTowers(buildings, units, gameState, dt, dmgMult, asMult) {
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
        // Tower Damage Multiplier
        const towerDamage = (tower.damage || 15) * dmgMult;
        
        const proj = createProjectile({
          id: gameState.nextEntityId++,
          ownerId: tower.id,
          targetId: target.id,
          damage: towerDamage,
          team: tower.team,
          col: tower.col,
          row: tower.row,
          speed: 10.0,
          type: "cannonball",
        });
        gameState.projectiles.push(proj);
        
        // Tower Attack Speed Multiplier
        const towerAS = (tower.attackSpeed || 1.2) * asMult;
        tower.attackCooldown = 1.0 / towerAS; // [FIX] Logic fixed logic
      }
    }
  }
}

