// server/systems/attackSystem.js

import { distance } from "../utils/math.js";
import { createProjectile } from "../entity/projectile.js";

export function updateAttacks(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  
  const allEntities = [...units, ...buildings];

  // Iterasi Unit & Tower sebagai penyerang
  // (Tower juga harus bisa menembak, jadi kita loop allEntities kalau tower aktif menyerang)
  // Untuk simplifikasi sekarang, kita loop units dulu, nanti tower dimasukkan ke logic attack juga.
  
  // KITA GABUNGKAN LOOP AGAR TOWER BISA MENEMBAK JUGA
  const attackers = [...units, ...buildings]; 

  for (const attacker of attackers) {
    if (attacker.hp <= 0) continue;

    // Cooldown logic
    if (attacker.attackCooldown > 0) {
        attacker.attackCooldown -= dt;
    }

    if (attacker.targetId === null) continue;

    // Cari target di list allEntities
    const target = allEntities.find(e => e.id === attacker.targetId);
    
    if (!target || target.hp <= 0) {
      attacker.targetId = null;
      continue;
    }

    // Cek Jarak
    const dist = distance(attacker, target);
    if (dist > attacker.range) continue;

    // Attack Trigger
    if (attacker.attackCooldown <= 0) {
      attacker.attackCooldown = attacker.attackSpeed || 1.0;

      // LOGIKA BARU: MELEE VS RANGED
      // Kita anggap range > 2.0 adalah Ranged Unit/Tower
      const isRanged = attacker.range > 2.0; 

      if (isRanged) {
        // --- RANGED: SPAWN PROJECTILE ---
        const proj = createProjectile({
          id: gameState.nextEntityId++,
          team: attacker.team,
          ownerId: attacker.id,
          targetId: target.id,
          row: attacker.row,
          col: attacker.col,
          damage: attacker.damage,
          speed: 8.0, // Kecepatan peluru (tiles/sec)
          type: 'arrow' // Bisa diganti 'fireball' dll sesuai kartu
        });
        
        gameState.projectiles.push(proj);
        
      } else {
        // --- MELEE: INSTANT DAMAGE ---
        target.hp -= attacker.damage;
        console.log(`${attacker.id} hit ${target.id} (Melee). HP: ${target.hp}`);
      }
    }
  }
}