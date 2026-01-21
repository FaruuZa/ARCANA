
export const OMENS = {
    // 1. MANA MODIFIERS
    "arcana_surge": {
        id: "arcana_surge",
        name: "Arcana Surge",
        description: "Mana regenerates 20% faster for both players.",
        type: "buff_global",
        target: "arcana_regen",
        value: 1.2
    },
    "mana_drought": {
        id: "mana_drought",
        name: "Mana Drought",
        description: "Mana regenerates 20% slower for both players.",
        type: "debuff_global",
        target: "arcana_regen",
        value: 0.8
    },

    // 2. UNIT MODIFIERS
    "blood_moon": {
        id: "blood_moon",
        name: "Blood Moon",
        description: "All units deal 25% more damage.",
        type: "buff_global",
        target: "damage",
        value: 1.25
    },
    "sluggish_waters": {
        id: "sluggish_waters",
        name: "Sluggish Waters",
        description: "All units move 15% slower.",
        type: "debuff_global",
        target: "speed",
        value: 0.85
    },
    "frenzy": {
        id: "frenzy",
        name: "Frenzy",
        description: "All units attack 20% faster.",
        type: "buff_global",
        target: "attack_speed",
        value: 1.2
    },

    // 3. SPECIAL
    /*
    "doppelganger": {
        id: "doppelganger",
        name: "Doppelganger",
        description: "Every unit spawns with a clone.",
        type: "mechanic",
        target: "spawn_clone",
        value: 1
    }
    */
};

// Roll Probability
export const OMEN_CHANCE = 0.5; // 50% chance to have an Omen
