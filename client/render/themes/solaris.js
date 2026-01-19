import { baseTheme } from "./baseTheme.js";

export const SOLARIS_THEME = {
  ...baseTheme,

  board: {
    background: 0x8888ff, // Biru Terang
    river: 0x3f6aa1,      // Biru Laut
    laneLine: 0xaaaaaa,   // Garis Putih
  },

  towers: {
    base: 0xFFD700, // EMAS (Gold)
  },

  units: {
    primary: 0xFFFF00, // KUNING TERANG
  }
};

// Opsional: Export alias agar kompatibel jika ada import lama
export const factionATheme = SOLARIS_THEME;