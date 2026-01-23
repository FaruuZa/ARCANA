import { distance } from "../utils/math.js";
import { dealAreaDamage, applyBuff } from "../utils/combat.js"; // Import helper combat

export function updateProjectiles(gameState, dt) {
  // Filter peluru mati
  gameState.projectiles = gameState.projectiles.filter((p) => !p.isDead);

  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings];

  for (const proj of gameState.projectiles) {
    if (proj.isDead) continue;

    // 1. CARI TARGET
    // (Asumsi saat ini peluru selalu homing/mengejar targetId)
    const target = allEntities.find((e) => e.id === proj.targetId);

    // Jika target hilang/mati di tengah jalan
    if (!target || target.hp <= 0) {
      proj.isDead = true;
      continue;
    }

    // 2. GERAKAN PELURU
    const dx = target.col - proj.col;
    const dy = target.row - proj.row;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Hitung langkah frame ini
    const moveStep = proj.speed * dt;

    if (dist <= moveStep || dist < 0.5) {
      // === HIT TARGET ===
      proj.isDead = true; // Hapus peluru

      // A. LOGIKA AREA OF EFFECT (AOE)
      // Contoh: Fireball, Ice Bomb
      if (proj.aoeRadius > 0) {
        
        dealAreaDamage(
            gameState, 
            proj,            // Origin ledakan (posisi peluru terakhir)
            proj.aoeRadius, 
            proj.damage, 
            proj.team, 
            proj.targetHeight, 
            'enemy',         // Default rule peluru biasanya serang musuh
            proj.onHitEffects // <--- [PENTING] Kirim Buff ke sini!
        );

        // Visual Ledakan Area
        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "shockwave", // Atau sesuaikan visual berdasarkan tipe proj
            col: proj.col,
            row: proj.row,
            radius: proj.aoeRadius,
            duration: 0.3,
            time: 0.3,
            color: proj.color || proj.aoeColor // [NEW] Inherit Color
        });

      } else {
        // B. LOGIKA SINGLE TARGET
        // Contoh: Panah biasa, Tembakan Ranger
        
        // 1. Deal Damage
        target.hp -= proj.damage;

        // 2. Apply Buffs (Slow, Poison, dll)
        if (proj.onHitEffects && proj.onHitEffects.length > 0) {
            proj.onHitEffects.forEach(buff => {
                applyBuff(target, buff);
            });
        }

        // Visual Hit Biasa
        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "impact", // Kecil
            col: target.col,
            row: target.row,
            radius: 0.5,
            duration: 0.1,
            time: 0.1
        });
      }

    } else {
      // Belum sampai -> Gerakkan peluru
      proj.col += (dx / dist) * moveStep;
      proj.row += (dy / dist) * moveStep;
    }
  }
}