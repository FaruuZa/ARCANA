import { distance } from "../utils/math.js";
import { dealAreaDamage, applyBuff } from "../utils/combat.js";
import { CARDS } from "../../shared/data/cards.js";

export function castRitual(gameState, playerId, teamId, cardId, targetPos, targetId) { // [NEW] Added targetId
    const card = CARDS[cardId];
    if (!card || card.type !== 'RITUAL') return;

    const spell = card.spellData;

    // [NEW] DELAY SYSTEM
    if (spell.delay && spell.delay > 0) {
        // Queue it
        if (!gameState.delayedSpells) gameState.delayedSpells = [];

        gameState.delayedSpells.push({
            id: gameState.nextEntityId++,
            playerId,
            teamId,
            card,
            spell, // copy ref
            targetPos: {...targetPos}, // copy val
            targetId,
            timer: spell.delay,
            maxTimer: spell.delay
        });
        return;
    }

    triggerSpellEffect(gameState, playerId, teamId, card, spell, targetPos, targetId);
}

// [NEW] Helper to actually triggering the spell effect
function triggerSpellEffect(gameState, playerId, teamId, card, spell, targetPos, targetId) {
    if (spell.type === "single_target") {
        if (!targetId) return; 

        // Re-find target (it might have died during delay)
        const entities = [...gameState.units, ...gameState.buildings];
        const target = entities.find(e => e.id === targetId);

        if (!target || target.hp <= 0) return; 
        
        // Update Target Pos to follow unit
        targetPos = { col: target.col, row: target.row };

        let isTeamValid = false;
        if (spell.targetTeam === 'both') isTeamValid = true;
        else if (spell.targetTeam === 'ally') isTeamValid = (target.team === teamId);
        else isTeamValid = (target.team !== teamId); 

        if (!isTeamValid) return;

        if (spell.damage) target.hp -= spell.damage;

        if (spell.buffs) {
            spell.buffs.forEach(buffConfig => {
                applyBuff(target, {
                    name: card.name + "_" + buffConfig.type, 
                    type: buffConfig.type,
                    value: buffConfig.value,
                    duration: buffConfig.duration,
                    sourceId: playerId
                });
            });
        }

        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "lightning_strike", 
            col: target.col,
            row: target.row,
            radius: 0.5,
            duration: 0.3,
            time: 0.3
        });
    }

    else if (spell.type === "damage_aoe") {
        dealAreaDamage(
            gameState,
            targetPos,
            spell.radius, 
            spell.damage, 
            teamId, 
            'both',
            'enemy',
            spell.buffs // [FIX] NOW PASSING BUFFS (STUN ETC)
        );

        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "explosion",
            col: targetPos.col,
            row: targetPos.row,
            radius: spell.radius,
            duration: 0.5,
            time: 0.5
        });
    }

    else if (spell.type === "buff_area") {
        const entities = [...gameState.units, ...gameState.buildings];
        
        entities.forEach(entity => {
            if (entity.hp <= 0) return;

            let isValid = false;
            if (spell.targetTeam === 'ally' && entity.team === teamId) isValid = true;
            if (spell.targetTeam === 'enemy' && entity.team !== teamId) isValid = true;

            if (!isValid) return;

            // Simple distance check
            if (distance(targetPos, entity) <= spell.radius) {
                if (spell.buffs) {
                    spell.buffs.forEach(buffConfig => {
                        applyBuff(entity, {
                            name: card.name + "_" + buffConfig.type, 
                            type: buffConfig.type,
                            value: buffConfig.value,
                            duration: buffConfig.duration,
                            sourceId: playerId
                        });
                    });
                }
                
                gameState.effects.push({
                    id: gameState.nextEntityId++,
                    type: "buff_shine", 
                    col: entity.col,
                    row: entity.row,
                    radius: 0.5,
                    duration: 0.5,
                    time: 0.5
                });
            }
        });

        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "shockwave",
            col: targetPos.col,
            row: targetPos.row,
            radius: spell.radius,
            duration: 0.5,
            time: 0.5
        });
    }

    else if (spell.type === "zone_lingering") {
        gameState.activeSpells.push({
            id: gameState.nextEntityId++,
            team: teamId,
            col: targetPos.col,
            row: targetPos.row,
            radius: spell.radius,
            duration: spell.duration,
            interval: spell.interval || 0.5,
            tickTimer: 0, 
            damage: spell.damage || 0,
            buffs: spell.buffs || [],
            targetTeam: spell.targetTeam || 'enemy' 
        });

        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "circle_zone", 
            col: targetPos.col,
            row: targetPos.row,
            radius: spell.radius,
            duration: spell.duration,
            time: spell.duration,
            damage: spell.damage // pass for visual coloring
        });
    }
}


// [NEW] Update Delayed Spells
export function updateDelayedSpells(gameState, dt) {
    if (!gameState.delayedSpells) return;

    for (let i = gameState.delayedSpells.length - 1; i >= 0; i--) {
        const ds = gameState.delayedSpells[i];
        ds.timer -= dt;

        if (ds.timer <= 0) {
            // Trigger!
            triggerSpellEffect(gameState, ds.playerId, ds.teamId, ds.card, ds.spell, ds.targetPos, ds.targetId);
            gameState.delayedSpells.splice(i, 1);
        }
    }
}

// [Implemented] Update Lingering Spells
export function updateSpells(gameState, dt) {
    updateDelayedSpells(gameState, dt); // Process Delays

    const activeSpells = gameState.activeSpells;
    // ... existing lingering logic ...
    for (let i = activeSpells.length - 1; i >= 0; i--) {
        const spell = activeSpells[i];
        
        spell.duration -= dt;
        spell.tickTimer -= dt;

        if (spell.tickTimer <= 0) {
            spell.tickTimer = spell.interval; // Reset timer

            // LOGIC AREA EFFECT
            if (spell.damage > 0) {
                 dealAreaDamage(
                    gameState, 
                    spell, 
                    spell.radius, 
                    spell.damage, 
                    spell.team, 
                    'both', 
                    spell.targetTeam, 
                    spell.buffs 
                );
            } else if (spell.buffs && spell.buffs.length > 0) {
                // Manual Scan
                const entities = [...gameState.units, ...gameState.buildings];
                for (const entity of entities) {
                    if (entity.hp <= 0) continue;
                    
                    let isValid = false;
                    if (spell.targetTeam === 'ally' && entity.team === spell.team) isValid = true;
                    if (spell.targetTeam === 'enemy' && entity.team !== spell.team) isValid = true;
                    if (spell.targetTeam === 'any') isValid = true;

                    if (isValid && distance(spell, entity) <= spell.radius) {
                        spell.buffs.forEach(b => {
                            applyBuff(entity, { 
                                ...b, 
                                sourceId: spell.id 
                            });
                        });
                    }
                }
            }
        }

        if (spell.duration <= 0) {
            activeSpells.splice(i, 1);
        }
    }
}