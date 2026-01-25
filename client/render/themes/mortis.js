import { baseTheme } from "./baseTheme.js";

export const MORTIS_THEME = {
    ...baseTheme,

    board: {
        background: 0x1B261B, // Dark Swampy Green
        floor: 0x2F4F4F,      // Dark Slate Grey
        river: 0x00FA9A,      // Eerie Spring Green (Slime/Soul river)
        riverAccent: 0xA9A9A9, // Dark Grey
        laneLine: 0x556B2F,   // Olive Drab
        environment: 0x0F190F, // Very Dark Forest
        bridge: 0x696969,     // Dim Grey
        bridgeDetail: 0x8B4513 // Saddle Brown
    },

    towers: {
        base: 0x8B0000,      // Dark Red
        secondary: 0x2E8B57, // Sea Green
        detail: 0x000000,    // Black
        king: 0x800080,      // Purple (Necrotic)
        princess: 0x483D8B   // Dark Slate Blue
    },

    units: {
        primary: 0x7FFF00,   // Chartreuse (Ghostly Green)
    }
};
