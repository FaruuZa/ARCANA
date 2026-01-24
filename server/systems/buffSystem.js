import { triggerTraitEffect } from "../utils/combat.js"; 

export function updateBuffs(gameState, dt) {
    const units = gameState.units;
    const buildings = gameState.buildings;
    const allEntities = [...units, ...buildings]; 

    // 1. PROSES AURA (Trait Aura)
    for (const source of allEntities) {
        if (source.hp <= 0) continue;
        if (source.isSilenced) continue; // [FIX] Block Aura when Silenced
        
        if (source.traits && source.traits.aura) {
            const aura = source.traits.aura;
            
            // [NEW] Aura Timer Logic
            if (source.auraTimer === undefined) source.auraTimer = 0;
            source.auraTimer -= dt;
            
            if (source.auraTimer <= 0) {
                // Reset Timer
                const interval = aura.interval || 0.2;
                source.auraTimer = interval;

                // 1. DAMAGE AURA (Cursed Idol, Spikes)
                if (aura.damage && aura.damage > 0) {
                    // Gunakan triggerTraitEffect untuk visual + damage
                    triggerTraitEffect(gameState, source, {
                        type: 'damage_aoe',
                        radius: aura.radius,
                        damage: aura.damage,
                        targetTeam: aura.targetTeam || 'enemy',
                        // Pass other props if needed
                    });
                }

                // 2. BUFF AURA (Existing Logic + Safety)
                if (aura.buffs && Array.isArray(aura.buffs)) {
                    triggerTraitEffect(gameState, source, {
                        type: 'buff_area',
                        radius: aura.radius,
                        targetTeam: aura.targetTeam || 'ally',
                        buffs: aura.buffs.map(b => ({
                            ...b,
                            duration: interval + 0.1 // Duration > Interval to prevent flickering
                        }))
                    });
                }
            }
        }
    }

    // 2. PROSES BUFF INDIVIDUAL
    for (const entity of allEntities) {
        if (entity.hp <= 0) continue;
        if (!entity.buffs) entity.buffs = [];

        // RESET FLAGS (Penting!)
        entity.isStunned = false;
        entity.isRooted = false;
        entity.isSilenced = false; // Reset dulu ke false

        // Reset Stats ke Base
        const baseSpeed = entity.baseSpeed !== undefined ? entity.baseSpeed : entity.speed;
        const baseDmg = entity.baseDamage !== undefined ? entity.baseDamage : entity.damage;
        const baseAtkSpd = entity.baseAttackSpeed !== undefined ? entity.baseAttackSpeed : entity.attackSpeed;
        entity.scale = 1.0; 
        entity.speed = baseSpeed;
        entity.damage = baseDmg;
        entity.attackSpeed = baseAtkSpd;
        
        // [FIX] Reset Range & AOE properties to prevent exponential growth
        if (entity.baseRange !== undefined) entity.range = entity.baseRange;
        if (entity.baseAoeRadius !== undefined) entity.aoeRadius = entity.baseAoeRadius;

        // LOOP BUFFS
        for (let i = entity.buffs.length - 1; i >= 0; i--) {
            const buff = entity.buffs[i];
            
            buff.duration -= dt;
            applyBuffEffect(entity, buff, dt); // Flag diset jadi true disini
            
            if (buff.duration <= 0) {
                entity.buffs.splice(i, 1);
            }
        }
        
        // Finalisasi stats turunan
        if (entity.baseRadius) {
            entity.radius = entity.baseRadius * entity.scale;
        }
    }
}

function applyBuffEffect(entity, buff, dt) {
    switch (buff.type) {
        case 'stun':
            entity.isStunned = true;
            entity.speed = 0; 
            break;
        case 'root':
            entity.isRooted = true;
            entity.speed = 0;
            break;
        case 'freeze':
            entity.isStunned = true;
            entity.speed = 0;
            entity.attackSpeed = 0; 
            break;
        
        // === [FIX] SILENCE ===
        case 'silence':
            entity.isSilenced = true; 
            // Unit tidak bisa cast skill / spell, tapi masih bisa jalan/pukul biasa
            break;

        case 'speed_mult':
            entity.speed *= buff.value;
            break;
        case 'damage_mult':
            entity.damage *= buff.value;
            break;
        case 'attack_speed_mult':
            entity.attackSpeed *= buff.value;
            break;
        case 'scale_mult':
            entity.scale *= buff.value;
            entity.range *= buff.value; 
            if (entity.aoeRadius) entity.aoeRadius *= buff.value;
            break;

        case 'poison':
        case 'burn':
        case 'regen':
            buff.tickTimer = (buff.tickTimer || 0) - dt;
            if (buff.tickTimer <= 0) {
                const isHeal = buff.type === 'regen';
                if (isHeal) entity.hp = Math.min(entity.hp + buff.value, entity.maxHp);
                else entity.hp -= buff.value;
                buff.tickTimer = 0.5; 
            }
            break;
    }
}