import { baseTheme } from "./baseTheme.js";

export const NOCTIS_THEME = {
  ...baseTheme,

  board: {
    background: 0x241e2b, // Ungu Gelap
    river: 0x4a2838,      // Merah Gelap/Darah
    laneLine: 0x554466,   // Garis Ungu Pucat
  },

  towers: {
    base: 0x9C27B0, // UNGU (Purple)
  },

  units: {
    primary: 0xE040FB, // UNGU NEON (Magenta)
  }
};

// Opsional: Export alias
export const factionBTheme = NOCTIS_THEME;