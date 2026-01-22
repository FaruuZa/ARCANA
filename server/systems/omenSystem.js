
import { OMENS, OMEN_CHANCE } from "../../shared/data/omens.js";

// Helper: Pick Random Omen (Weighted)
export function rollOmen(gameState) {
    if (Math.random() > OMEN_CHANCE) {
        gameState.activeOmen = null;
        return null;
    }

    const omenList = Object.values(OMENS);
    const totalWeight = omenList.reduce((sum, omen) => sum + (omen.weight || 1), 0);
    
    let roll = Math.random() * totalWeight;
    let selectedOmen = null;

    for (const omen of omenList) {
        const w = omen.weight || 1;
        if (roll < w) {
            selectedOmen = omen;
            break;
        }
        roll -= w;
    }
    
    // Fallback
    if (!selectedOmen) selectedOmen = omenList[0];

    gameState.activeOmen = selectedOmen;
    
    return selectedOmen;
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
