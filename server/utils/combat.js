import { distance } from "./math.js";

// Fungsi AOE Generic
export function dealAreaDamage(gameState, origin, radius, damage, attackerTeam, targetHeight = 'both') {
    const units = gameState.units;
    const buildings = gameState.buildings;
    const allEntities = [...units, ...buildings];

    let hitCount = 0;

    for (const entity of allEntities) {
        if (entity.hp <= 0) continue;
        if (entity.team === attackerTeam) continue; // No Friendly Fire

        // 1. Cek Jarak (Circle Collision)
        // Kita pakai posisi 'origin' (bisa berupa Unit, Projectile, atau Koordinat {col, row})
        const dist = distance(origin, entity);
        
        // +0.5 toleransi untuk hitbox unit
        if (dist <= radius + 0.5) {
            
            // 2. Cek Height (Ground vs Air)
            // AOE ledakan tanah (Bomb) tidak kena unit terbang
            const entMoveType = entity.movementType || 'ground';
            
            let isValid = true;
            if (targetHeight === 'ground' && entMoveType !== 'ground') isValid = false;
            if (targetHeight === 'air' && entMoveType !== 'flying') isValid = false;

            if (isValid) {
                entity.hp -= damage;
                hitCount++;
            }
        }
    }
    return hitCount;
}