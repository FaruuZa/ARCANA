
import { OMENS, OMEN_CHANCE } from "../../shared/data/omens.js";

// Helper: Pick Random Omen
export function rollOmen(gameState) {
    if (Math.random() > OMEN_CHANCE) {
        gameState.activeOmen = null;
        return null;
    }

    const keys = Object.keys(OMENS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const omen = OMENS[randomKey];

    gameState.activeOmen = omen;
    
    // Immediate Effects (One-time application if any)
    // Most Omens are passive modifiers checked in other systems
    
    return omen;
}

// Helper: Get Multiplier for a Stat
export function getOmenMultiplier(gameState, statName) {
    if (!gameState.activeOmen) return 1.0;
    
    const omen = gameState.activeOmen;
    if (omen.target === statName) {
        return omen.value;
    }
    
    return 1.0;
}
