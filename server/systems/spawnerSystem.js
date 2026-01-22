import { CARDS } from "../../shared/data/cards.js";
import { playUnitCard } from "./cardSystem.js"; 

// Helper to spawn without card logic (direct spawn)
// Or we can reuse playUnitCard?
// playUnitCard expects a Card ID. If spawner defines a unit Card ID, that works.
// However, playUnitCard consumes Arcana and checks constraints.
// We need a "SpawnHelper" that bypasses checks.

export function updateSpawners(gameState, dt) {
    const allEntities = [...gameState.units, ...gameState.buildings];

    for (const ent of allEntities) {
        if (ent.hp <= 0) continue;
        if (!ent.traits || !ent.traits.spawner) continue;

        const sp = ent.traits.spawner;
        
        // Initialize State
        if (ent.spawnTimer === undefined) ent.spawnTimer = 0;
        
        // Update Timer
        ent.spawnTimer += dt;
        
        // Check Interval
        if (ent.spawnTimer >= sp.interval) {
            ent.spawnTimer = 0; // Reset
            
            // Spawn logic
            const count = sp.count || 1;
            
            for (let i = 0; i < count; i++) {
                // Random position offset around parent
                // If Building: 0.0 offset (spawn at center?) or edge?
                // Building has radius 1.0. Spawn at 1.5 radius.
                
                const angle = Math.random() * Math.PI * 2;
                const r = (ent.radius || 0.5) + (sp.radius || 0.5);
                
                const spawnCol = ent.col + Math.cos(angle) * r;
                const spawnRow = ent.row + Math.sin(angle) * r;
                
                // Use cardSystem helper but "free" cost
                // Actually playUnitCard is high level. 
                // We should call spawnUnit directly from gameState?
                // gameState.js doesn't export spawnUnit directly easily?
                // Wait, gameState.js exports spawnUnit!
                
                spawnUnitFromTrait(gameState, ent.team, sp.unitId, spawnCol, spawnRow);
            }
        }
    }
}

// Need to import spawnUnit from gameState.js
// Importing circular dependency? 
// server.js imports gameState.js
// systems imports gameState.js? No, gameState passed as arg.
// But spawnUnit is a function exported by gameState.js.

import { spawnUnit } from "../gameState.js"; // This might be circular if gameState imports systems.
// check gameState.js imports: constants, building, unit, spatialHash.
// It DOES NOT import systems. So safe.

function spawnUnitFromTrait(gameState, team, cardId, col, row) {
    // Lookup card data for stats
    const card = CARDS[cardId];
    if (!card) return;

    // Use shared spawn logic
    spawnUnit(gameState, {
        team: team,
        cardId: cardId,
        col: col,
        row: row,
        
        // Card Stats
        hp: card.stats.hp,
        damage: card.stats.damage,
        range: card.stats.range, 
        speed: card.stats.speed,
        attackSpeed: card.stats.hitSpeed,
        deployTime: 0.5, // Faster spawn from building
        aimTime: card.stats.firstHitDelay,
        
        movementType: card.type === 'vessel' ? (card.tags.includes('air') ? 'flying' : 'ground') : 'ground',
        targetTeam: "enemy",
        targetRule: "ground-air", 
        targetHeight: "both",
        
        traits: card.traits || {}
    });
}
