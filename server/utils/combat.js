import { distance } from "./math.js";
import { spawnUnit } from "../gameState.js"; // [FIX] Import spawnUnit

// [HELPER] Apply Buff
export function applyBuff(target, buffData) {
    if (!target || target.hp <= 0) return;
    if (!target.buffs) target.buffs = [];

    // Cek Stacking (Refresh duration jika nama/tipe sama)
    const existingBuff = target.buffs.find(b => b.name === (buffData.name || buffData.type));

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

// [HELPER] Deal Area Damage
export function dealAreaDamage(gameState, origin, radius, damage, attackerTeam, targetHeight = 'both', targetRule = 'enemy', onHitEffects = []) {
    const units = gameState.units;
    const buildings = gameState.buildings;
    const allEntities = [...units, ...buildings];

    let hitCount = 0;

    for (const entity of allEntities) {
        if (entity.hp <= 0) continue;
        
        let isTeamValid = false;
        if (targetRule === 'both') isTeamValid = true;
        else if (targetRule === 'ally') isTeamValid = (entity.team === attackerTeam);
        else isTeamValid = (entity.team !== attackerTeam);

        if (!isTeamValid) continue;

        const dist = distance(origin, entity);
        
        if (dist <= radius + 0.5) { // +0.5 toleransi radius tubuh
            const entMoveType = entity.movementType || 'ground';
            let isValid = true;
            if (targetHeight === 'ground' && entMoveType !== 'ground') isValid = false;
            if (targetHeight === 'air' && entMoveType !== 'flying') isValid = false;

            if (isValid) {
                entity.hp -= damage;
                hitCount++;

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

// === [NEW] TRIGGER TRAIT EFFECT ===
export function triggerTraitEffect(gameState, sourceUnit, effectData) {
    if (!effectData) return;

    // 1. EFEK DAMAGE / LEDAKAN (Giant Skeleton / Fire Spirit)
    if (effectData.type === 'damage_aoe') {
        dealAreaDamage(
            gameState,
            sourceUnit, 
            effectData.radius,
            effectData.damage,
            sourceUnit.team,
            'both', 
            'enemy', 
            effectData.buffs 
        );
        
        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "explosion",
            col: sourceUnit.col,
            row: sourceUnit.row,
            radius: effectData.radius,
            duration: 0.5
        });
    }

    // 2. EFEK BUFF AREA (Aura / Rage / Heal)
    else if (effectData.type === 'buff_area') {
        const targets = [...gameState.units, ...gameState.buildings];
        
        targets.forEach(target => {
            if (target.hp <= 0) return;
            
            const isAlly = target.team === sourceUnit.team;
            if (effectData.targetTeam === 'ally' && !isAlly) return;
            if (effectData.targetTeam === 'enemy' && isAlly) return;

            if (distance(sourceUnit, target) <= effectData.radius) {
                if (effectData.buffs) {
                    effectData.buffs.forEach(b => {
                        // Jika buff adalah 'instant' (seperti heal langsung), proses di sini
                        if (b.type === 'heal_instant') {
                            target.hp = Math.min(target.maxHp, target.hp + b.value);
                        } else {
                            applyBuff(target, { ...b, sourceId: sourceUnit.id });
                        }
                    });
                }
            }
        });
    }

    // 3. EFEK SPAWN MINION (Golem / Tombstone)
    else if (effectData.type === 'spawn') {
        const count = effectData.count || 1;
        for(let i=0; i<count; i++) {
            const offsetX = (Math.random() - 0.5) * 1.5; // Spread sedikit
            const offsetY = (Math.random() - 0.5) * 1.5;
            
            spawnUnit(gameState, {
                cardId: effectData.unitId,
                team: sourceUnit.team,
                col: Math.max(1, Math.min(17, sourceUnit.col + offsetX)),
                row: sourceUnit.row + offsetY,
                // Stats default ambil dari cardId di spawnUnit gameState
            });
        }
    }
}