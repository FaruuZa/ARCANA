import { baseTheme } from "./baseTheme.js";

export const SOLARIS_THEME = {
  ...baseTheme,

  board: {
    background: 0xE8DCCA, // Sand/Beige Marble (Ground-like)
    floor: 0xF5E6D3,      // Lighter Sand
    river: 0x4FC3F7,      // Light Blue River
    riverAccent: 0xB3E5FC,
    laneLine: 0xC0A080,   // Sandstone Darker
    environment: 0xF0F8FF,
    bridge: 0xE0E0E0,     
    bridgeDetail: 0xC0C0C0
  },

  towers: {
    base: 0xFFD700,      // Gold
    secondary: 0xFFFFFF, // Pure White Marble (High contrast vs Beige)
    detail: 0x00BFFF,    // Deep Sky Blue
    king: 0xFFA000,      
    princess: 0xFFECB3   
  },

  units: {
    primary: 0xFFEB3B, // Bright Yellow
  }
};

// Opsional: Export alias agar kompatibel jika ada import lama
export const factionATheme = SOLARIS_THEME;