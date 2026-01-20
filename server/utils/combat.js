import { distance } from "./math.js";

// [NEW] Helper Apply Buff (Export agar bisa dipanggil projectileSystem)
export function applyBuff(target, buffData) {
    if (!target || target.hp <= 0) return;
    if (!target.buffs) target.buffs = [];

    // Cek Stacking (Refresh duration jika nama sama)
    const existingBuff = target.buffs.find(b => b.name === buffData.name);

    if (existingBuff) {
        existingBuff.duration = Math.max(existingBuff.duration, buffData.duration);
    } else {
        target.buffs.push({
            name: buffData.name || buffData.type,
            type: buffData.type,
            value: buffData.value,
            duration: buffData.duration,
            sourceId: buffData.sourceId,
            tickTimer: 0 
        });
    }
}

// [UPDATE] Tambahkan parameter 'onHitEffects' (Default kosong)
export function dealAreaDamage(gameState, origin, radius, damage, attackerTeam, targetHeight = 'both', targetRule = 'enemy', onHitEffects = []) {
    const units = gameState.units;
    const buildings = gameState.buildings;
    const allEntities = [...units, ...buildings];

    let hitCount = 0;

    for (const entity of allEntities) {
        if (entity.hp <= 0) continue;
        
        // Logic Targeting (Ally/Enemy/Both)
        let isTeamValid = false;
        if (targetRule === 'both') isTeamValid = true;
        else if (targetRule === 'ally') isTeamValid = (entity.team === attackerTeam);
        else isTeamValid = (entity.team !== attackerTeam);

        if (!isTeamValid) continue;

        // 1. Cek Jarak
        const dist = distance(origin, entity);
        
        if (dist <= radius + 0.5) {
            
            // 2. Cek Height
            const entMoveType = entity.movementType || 'ground';
            let isValid = true;
            if (targetHeight === 'ground' && entMoveType !== 'ground') isValid = false;
            if (targetHeight === 'air' && entMoveType !== 'flying') isValid = false;

            if (isValid) {
                // DEAL DAMAGE
                entity.hp -= damage;
                hitCount++;

                // [NEW] APPLY BUFFS TO AREA VICTIM
                if (onHitEffects && onHitEffects.length > 0) {
                    onHitEffects.forEach(buff => {
                        applyBuff(entity, buff);
                    });
                }
            }
        }
    }
    return hitCount;
}