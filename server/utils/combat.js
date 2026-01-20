import { distance } from "./math.js";

// Fungsi AOE Generic
export function dealAreaDamage(gameState, origin, radius, damage, attackerTeam, targetHeight = 'both', targetRule = 'enemy') {
    const units = gameState.units;
    const buildings = gameState.buildings;
    const allEntities = [...units, ...buildings];

    let hitCount = 0;

    for (const entity of allEntities) {
        if (entity.hp <= 0) continue;
        
        // === [FIX] LOGIC TARGETING BARU (BOTH / ALLY / ENEMY) ===
        let isTeamValid = false;
        
        if (targetRule === 'both') {
            isTeamValid = true; // Hajar semua (termasuk teman)
        } else if (targetRule === 'ally') {
            isTeamValid = (entity.team === attackerTeam); // Hanya teman
        } else {
            // Default: 'enemy'
            isTeamValid = (entity.team !== attackerTeam); // Hanya musuh
        }

        if (!isTeamValid) continue;
        // ========================================================

        // 1. Cek Jarak (Circle Collision)
        const dist = distance(origin, entity);
        
        if (dist <= radius + 0.5) {
            
            // 2. Cek Height
            const entMoveType = entity.movementType || 'ground';
            let isValid = true;
            if (targetHeight === 'ground' && entMoveType !== 'ground') isValid = false;
            if (targetHeight === 'air' && entMoveType !== 'flying') isValid = false;

            if (isValid) {
                if((entity.hp - damage) >= entity.maxHp){
                    entity.hp = entity.maxHp;
                } else {
                    entity.hp = Math.max(0, entity.hp - damage);
                }
                hitCount++;
            }
        }
    }
    return hitCount;
}