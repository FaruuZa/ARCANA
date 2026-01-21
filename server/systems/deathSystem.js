import { triggerTraitEffect } from "../utils/combat.js";

export function processDeaths(gameState) {
    // Cek Unit Mati
    for (let i = gameState.units.length - 1; i >= 0; i--) {
        const unit = gameState.units[i];
        
        if (unit.hp <= 0) {
            // === [NEW] TRIGGER ON-DEATH ===
            // Pastikan hanya trigger sekali (flag isDead sudah ada di unit.js?)
            if (!unit.isDeadProcessed) { // Tambahkan flag temporary jika perlu
                if (unit.traits && unit.traits.onDeath) {
                    triggerTraitEffect(gameState, unit, unit.traits.onDeath);
                }
                unit.isDeadProcessed = true;
            }

            // Hapus dari game
            gameState.units.splice(i, 1);
        }
    }

    // Cek Building Mati (Optional, jika Building punya death effect)
    for (let i = gameState.buildings.length - 1; i >= 0; i--) {
        const b = gameState.buildings[i];
        if (b.hp <= 0) {
             if (b.traits && b.traits.onDeath) {
                 triggerTraitEffect(gameState, b, b.traits.onDeath);
             }
             gameState.buildings.splice(i, 1);
             
             // Check Win Condition (King Tower)
             if (b.type === 'king') {
                 gameState.winner = (b.team === 0) ? 1 : 0;
                 gameState.phase = 'ended';
             }
        }
    }
}