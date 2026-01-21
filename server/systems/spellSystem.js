import { distance } from "../utils/math.js";
import { dealAreaDamage, applyBuff } from "../utils/combat.js";
import { CARDS } from "../../shared/data/cards.js";

export function castRitual(gameState, playerId, teamId, cardId, targetPos) {
    const card = CARDS[cardId];
    if (!card || card.type !== 'RITUAL') return;

    const spell = card.spellData;

    // --- TIPE 1: INSTANT DAMAGE AREA (Fireball, Zap) ---
    if (spell.type === "damage_aoe") {
        
        dealAreaDamage(
            gameState,
            targetPos,     // Origin {col, row}
            spell.radius, 
            spell.damage, 
            teamId, 
            'both',        // Hit ground & air
            'enemy'        // Hit musuh saja
        );

        // Visual Effect
        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "explosion", // Pastikan ada di client renderer
            col: targetPos.col,
            row: targetPos.row,
            radius: spell.radius,
            duration: 0.5,
            time: 0.5
        });
    }

    // --- TIPE 2: BUFF AREA (War Cry, Healing Totem) ---
    else if (spell.type === "buff_area") {
        
        const entities = [...gameState.units, ...gameState.buildings];
        
        entities.forEach(entity => {
            if (entity.hp <= 0) return;

            // Filter Target (Ally/Enemy)
            let isValid = false;
            if (spell.targetTeam === 'ally' && entity.team === teamId) isValid = true;
            if (spell.targetTeam === 'enemy' && entity.team !== teamId) isValid = true;

            if (!isValid) return;

            // Cek Jarak dari pusat klik
            if (distance(targetPos, entity) <= spell.radius) {
                
                // Terapkan Semua Buff
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
                
                // Visual Effect Individual (Pada Unit)
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

        // Visual Effect Area (Lingkaran Tanah)
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

    // --- TIPE 3: LINGERING ZONE (Poison Cloud, Blizzard, Healing Ward) ---
    else if (spell.type === "zone_lingering") {
        gameState.activeSpells.push({
            id: gameState.nextEntityId++,
            team: teamId,
            col: targetPos.col,
            row: targetPos.row,
            radius: spell.radius,
            duration: spell.duration,
            interval: spell.interval || 0.5,
            tickTimer: 0, // Tick immediately? Or wait? Let's wait 'interval' first or 0.1
            
            damage: spell.damage || 0,
            buffs: spell.buffs || [],
            targetTeam: spell.targetTeam || 'enemy' 
        });

        // Visual Awal (Spawn Circle)
        gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "circle_zone", 
            col: targetPos.col,
            row: targetPos.row,
            radius: spell.radius,
            duration: spell.duration, // Client bisa render lingkaran selama duration
            time: spell.duration
        });
    }
}

// [Implemented] Update Lingering Spells
export function updateSpells(gameState, dt) {
    const activeSpells = gameState.activeSpells;

    for (let i = activeSpells.length - 1; i >= 0; i--) {
        const spell = activeSpells[i];
        
        spell.duration -= dt;
        spell.tickTimer -= dt;

        if (spell.tickTimer <= 0) {
            spell.tickTimer = spell.interval; // Reset timer

            // LOGIC AREA EFFECT
            // Jika ada damage, pakai dealAreaDamage (bisa sekalian apply buff hit)
            // Jika HANYA buff (tanpa damage), manual scan.

            if (spell.damage > 0) {
                 dealAreaDamage(
                    gameState, 
                    spell, // Origin {col, row}
                    spell.radius, 
                    spell.damage, 
                    spell.team, 
                    'both', 
                    spell.targetTeam, // 'enemy' / 'ally' / 'any'
                    spell.buffs // Pass buffs ke onHitEffects
                );
            } else if (spell.buffs && spell.buffs.length > 0) {
                // Manual Scan untuk Buff Only (e.g. Healing Ward)
                const entities = [...gameState.units, ...gameState.buildings];
                for (const entity of entities) {
                    if (entity.hp <= 0) continue;
                    
                    let isValid = false;
                    if (spell.targetTeam === 'ally' && entity.team === spell.team) isValid = true;
                    if (spell.targetTeam === 'enemy' && entity.team !== spell.team) isValid = true;
                    if (spell.targetTeam === 'any') isValid = true;

                    if (isValid && distance(spell, entity) <= spell.radius) {
                        // Apply All Buffs
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