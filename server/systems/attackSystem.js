import { distance } from "../utils/math.js";
import { createProjectile } from "../entity/projectile.js";

export function updateAttacks(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  
  // [FIX] Definisikan allEntities untuk lookup target
  const allEntities = [...units, ...buildings];

  // === 1. UNIT ATTACKS (Logic State Machine) ===
  for (const unit of units) {
    if (unit.hp <= 0) continue;

    // Kurangi cooldown
    if (unit.attackCooldown > 0) {
        unit.attackCooldown -= dt;
    }

    // SYARAT WAJIB: State harus 'attacking'
    // Jika state masih 'moving' atau 'pre_attack', dia tidak boleh menembak
    if (unit.state !== 'attacking') continue;

    // Fire Logic
    if (unit.attackCooldown <= 0 && unit.targetId) {
        const target = allEntities.find(e => e.id === unit.targetId);
        
        // Validasi Target
        if (target && target.hp > 0) {
             // Cek Range lagi untuk keamanan (server authority)
             // +0.5 toleransi agar tidak glitch di ujung range
             if (distance(unit, target) <= unit.range + 0.5) {
                 
                 // Spawn Projectile
                 const isMelee = unit.range <= 2.0;
                 
                 const proj = createProjectile({
                    id: gameState.nextEntityId++,
                    ownerId: unit.id,
                    targetId: target.id,
                    damage: unit.damage,
                    team: unit.team,
                    col: unit.col,
                    row: unit.row,
                    speed: isMelee ? 20.0 : 10.0, // Melee cepat, Ranged standar
                    type: isMelee ? 'slash' : 'arrow'
                 });
                 gameState.projectiles.push(proj);

                 // Reset Cooldown
                 unit.attackCooldown = 1.0 / unit.attackSpeed;
             }
        } else {
            // Target mati saat attacking -> TargetingSystem akan handle switch ke 'moving' tick depan
            unit.targetId = null; 
        }
    }
  }

  // === 2. TOWER ATTACKS (Logic Auto-Turret) ===
  // Tower tidak punya state 'attacking', dia selalu siap tembak
  for (const tower of buildings) {
    if (tower.hp <= 0) continue;

    if (tower.attackCooldown > 0) {
        tower.attackCooldown -= dt;
    }

    // Tower langsung scan musuh terdekat
    if (tower.attackCooldown <= 0) {
        let target = null;
        let minDist = tower.range;

        // Cari musuh (Prioritas Unit)
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
            // Tembak!
            const proj = createProjectile({
                id: gameState.nextEntityId++,
                ownerId: tower.id,
                targetId: target.id,
                damage: 15, // Default damage tower
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