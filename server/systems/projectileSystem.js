import { distance } from "../utils/math.js";
import { dealAreaDamage } from "../utils/combat.js";

export function updateProjectiles(gameState, dt) {
    const projectiles = gameState.projectiles;
    const allEntities = [...gameState.units, ...gameState.buildings];

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        // 1. Cari Target (Homing Missile Logic)
        const target = allEntities.find(e => e.id === proj.targetId);

        let destCol, destRow;

        if (target && target.hp > 0) {
            // Update tujuan ke posisi target terbaru (Homing)
            destCol = target.col;
            destRow = target.row;
        } else {
            // Target mati saat peluru terbang?
            // Opsi A: Peluru hilang (Simple) -> projectiles.splice(i, 1); continue;
            // Opsi B: Peluru lanjut ke posisi TERAKHIR target (Realistic)
            // Kita pakai Opsi B (Lanjut ke koordinat terakhir target)
            destCol = proj.targetCol || proj.col; 
            destRow = proj.targetRow || proj.row;
        }

        // Simpan Last Known Position (untuk Opsi B)
        proj.targetCol = destCol;
        proj.targetRow = destRow;

        // 2. Gerakan
        const dx = destCol - proj.col;
        const dy = destRow - proj.row;
        const distToTarget = Math.sqrt(dx*dx + dy*dy);
        
        const moveStep = proj.speed * dt;

        if (distToTarget <= moveStep) {
            // === HIT! ===
            
            if (proj.aoeRadius > 0) {
                // [PROJECTILE AOE EXPLOSION]
                // Meledak di lokasi saat ini (destCol, destRow)
                dealAreaDamage(
                    gameState, 
                    { col: destCol, row: destRow }, // Origin ledakan
                    proj.aoeRadius, 
                    proj.damage, 
                    proj.team, 
                    proj.targetHeight || 'both'
                );
                
                // (TODO: Emit Visual Explosion Effect ke Client)
                gameState.effects.push({
                    id: gameState.nextEntityId++,
                    type: 'explosion',
                    col: destCol, 
                    row: destRow,
                    radius: proj.aoeRadius,
                    duration: 0.3,
                    time: 0.3
                });

            } else {
                // [SINGLE TARGET HIT]
                if (target && target.hp > 0) {
                    target.hp -= proj.damage;
                }
            }

            // Hapus Projectile
            projectiles.splice(i, 1);

        } else {
            // Move Forward
            proj.col += (dx / distToTarget) * moveStep;
            proj.row += (dy / distToTarget) * moveStep;
        }
    }
}