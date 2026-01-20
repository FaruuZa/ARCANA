import { distance } from "../utils/math.js";
import { createProjectile } from "../entity/projectile.js";
import { dealAreaDamage } from "../utils/combat.js";

export function updateAttacks(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings];

  for (const unit of units) {
    if (unit.hp <= 0) continue;

    // 0. Handle Spawning (State Timer)
    if (unit.state === 'spawning') {
        unit.stateTimer -= dt;
        if (unit.stateTimer <= 0) unit.state = 'moving';
        continue;
    }

    // 1. Manage Cooldown (Selalu berkurang)
    if (unit.attackCooldown > 0) unit.attackCooldown -= dt;

    // 2. STATE MACHINE Logic berdasarkan INTENT
    const intent = unit.intent;

    if (intent.type === 'engage' && intent.targetId) {
        const target = allEntities.find(e => e.id === intent.targetId);
        
        // Safety check (kalau target tiba-tiba hilang sebelum targeting update)
        if (!target || target.hp <= 0) {
            unit.state = 'moving'; // Fallback
        } else {
            const dist = distance(unit, target);
            
            // Apakah dalam Jangkauan?
            // +0.5 toleransi agar tidak "dansa" maju mundur di perbatasan range
            if (dist <= unit.range + 0.5) {
                // DALAM RANGE -> COMBAT MODE
                
                if (unit.state === 'moving') {
                    // Transisi: Moving -> Pre-Attack (Aiming)
                    unit.state = 'pre_attack';
                    unit.stateTimer = unit.aimTime;
                } 
                else if (unit.state === 'pre_attack') {
                    // Sedang membidik...
                    unit.stateTimer -= dt;
                    if (unit.stateTimer <= 0) {
                        unit.state = 'attacking'; // Siap tembak
                    }
                }
                else if (unit.state === 'attacking') {
                    // Sudah attacking, tunggu cooldown untuk menembak lagi
                    performAttack(unit, target, gameState);
                }

            } else {
                // DILUAR RANGE -> KEJAR
                // Paksa state jadi moving agar MovementSystem bekerja
                unit.state = 'moving';
                // Reset pre-attack timer jika kita terpaksa bergerak
                unit.stateTimer = 0; 
            }
        }
    } else {
        // Intent = 'idle' (Lane Push)
        // Paksa state jadi moving
        unit.state = 'moving';
    }
  }

  // === TOWER LOGIC (Tetap sama, simple turret) ===
  updateTowers(buildings, units, gameState, dt);
}

function performAttack(unit, target, gameState) {
    if (unit.attackCooldown <= 0) {
        
        const isRanged = unit.range > 2.0;

        if (isRanged) {
            // [RANGED ATTACK]
            const proj = createProjectile({
                id: gameState.nextEntityId++,
                ownerId: unit.id,
                targetId: target.id,
                damage: unit.damage,
                team: unit.team,
                col: unit.col,
                row: unit.row,
                speed: 10.0,
                type: unit.projectileType || 'arrow', // Custom visual
                
                // Pass Data AOE ke Projectile
                aoeRadius: unit.aoeRadius || 0,
                targetHeight: unit.targetHeight // Projectile mewarisi rule target unit
            });
            gameState.projectiles.push(proj);

        } else {
            // [MELEE ATTACK]
            
            if (unit.aoeRadius > 0) {
                // === MELEE AOE LOGIC ===
                
                if (unit.aoeType === 'self') {
                    // Tipe VALKYRIE: Muter di tempat
                    dealAreaDamage(gameState, unit, unit.aoeRadius, unit.damage, unit.team, unit.targetHeight);
                    
                    // [NEW] VISUAL EFEK PUTARAN (SPIN)
                    gameState.effects.push({
                        id: gameState.nextEntityId++,
                        type: 'spin', // Tipe visual baru
                        col: unit.col,
                        row: unit.row,
                        radius: unit.aoeRadius,
                        duration: 0.3, // Cepat (0.3 detik)
                        time: 0.3
                    });

                } else {
                    // Tipe CLEAVE/SLAM: Hantam target
                    dealAreaDamage(gameState, target, unit.aoeRadius, unit.damage, unit.team, unit.targetHeight);
                    
                    // [NEW] VISUAL EFEK HANTAMAN (SLAM)
                    gameState.effects.push({
                        id: gameState.nextEntityId++,
                        type: 'shockwave', // Tipe visual baru
                        col: target.col, // Efek muncul di musuh
                        row: target.row,
                        radius: unit.aoeRadius,
                        duration: 0.2,
                        time: 0.2
                    });
                }

            } else {
                // SINGLE TARGET MELEE (Biasa)
                target.hp -= unit.damage;
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
                if (d <= minDist) { minDist = d; target = enemy; }
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
                    type: 'cannonball'
                });
                gameState.projectiles.push(proj);
                tower.attackCooldown = 1.0; 
            }
        }
    }
}