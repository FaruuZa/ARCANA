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
}

// (OPSIONAL) Fungsi Update untuk Spell yang memiliki durasi di tanah (Blizzard, Poison Cloud)
// Nanti dipanggil di gameLoop
export function updateSpells(gameState, dt) {
    // Jika nanti kamu punya spell yang "nempel" di tanah (Zone),
    // Kamu simpan di gameState.activeSpells dan loop disini.
}