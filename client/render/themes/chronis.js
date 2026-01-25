import { baseTheme } from "./baseTheme.js";

export const CHRONIS_THEME = {
    ...baseTheme,

    board: {
        background: 0x0A1929, // Deep Navy Blue (Space/Time)
        floor: 0x1E3A5F,      // Steel Blue
        river: 0x00BFFF,      // Deep Sky Blue (Energy stream)
        riverAccent: 0xFFFFFF, // White stars/sparkles
        laneLine: 0x4fc3f7,   // Light Blue Neon
        environment: 0x050A14, // Void Blue
        bridge: 0xB0C4DE,     // Light Steel Blue
        bridgeDetail: 0xFFD700 // Gold (Clockwork gears)
    },

    towers: {
        base: 0x1E90FF,      // Dodger Blue
        secondary: 0xC0C0C0, // Silver
        detail: 0xFFD700,    // Gold
        king: 0x00BFFF,      // Cyan
        princess: 0xADD8E6   // Light Blue
    },

    units: {
        primary: 0x00FFFF,   // Cyan
    }
};
