
export const OMENS = {
    // 1. MANA MODIFIERS
    "arcana_surge": {
        id: "arcana_surge",
        name: "Arcana Surge",
        description: "Mana regenerates 20% faster for both players.",
        type: "buff_global",
        target: "arcana_regen",
        value: 1.2,
        weight: 10 // Common
    },
    "mana_drought": {
        id: "mana_drought",
        name: "Mana Drought",
        description: "Mana regenerates 20% slower for both players.",
        type: "debuff_global",
        target: "arcana_regen",
        value: 0.8,
        weight: 10 // Common
    },

    // 2. UNIT MODIFIERS
    "blood_moon": {
        id: "blood_moon",
        name: "Blood Moon",
        description: "All units deal 25% more damage.",
        type: "buff_global",
        target: "damage",
        value: 1.25,
        weight: 10 // Uncommon
    },
    "sluggish_waters": {
        id: "sluggish_waters",
        name: "Sluggish Waters",
        description: "All units move 20% slower.",
        type: "debuff_global",
        target: "speed",
        value: 0.80,
        weight: 5 // Uncommon
    },
    "frenzy": {
        id: "frenzy",
        name: "Frenzy",
        description: "All units attack 20% faster.",
        type: "buff_global",
        target: "attack_speed",
        value: 1.2,
        weight: 5 // Uncommon
    },

    // 3. SPECIAL
    "global_silence": {
        id: "global_silence",
        name: "Hushed Valley",
        description: "All units are Silenced (cannot use abilities).",
        type: "buff_global",
        target: "silence",
        value: 1,
        weight: 3 // Rare
    },
    "global_poison": {
        id: "global_poison",
        name: "Toxic Mist",
        description: "All units take 20 damage per second.",
        type: "debuff_global",
        target: "poison",
        value: 10, // 10 per tick (0.5s) = 20 DPS
        weight: 3
    },
    "chaos_swap": {
        id: "chaos_swap",
        name: "Trickster's Gambit",
        description: "Factions and Decks are SWAPPED between players!",
        type: "special",
        target: "swap",
        value: 1,
        weight: 1 // Very Rare/Chaos
    }
};

// Roll Probability
export const OMEN_CHANCE = 0.7; // 70% chance to have an Omen
