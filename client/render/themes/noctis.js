import { baseTheme } from "./baseTheme.js";

export const NOCTIS_THEME = {
  ...baseTheme,

  board: {
    background: 0x2C242B, // Dark Purple-ish Soil (Ground-like)
    floor: 0x3E343E,      // Lighter Dirt
    river: 0x880E4F,     
    riverAccent: 0xE91E63,
    laneLine: 0x5C4B5E,   // Muted Purple Line
    environment: 0x121212,
    bridge: 0x424242,     
    bridgeDetail: 0xAB47BC 
  },

  towers: {
    base: 0x7B1FA2,      // Purple
    secondary: 0x1A1A1A, // Dark Stone (Contrast against ground?)
    // Make secondary lighter than background? Or Darker?
    // If background is 0x2C242B, Tower Obsidian 0x1A1A1A is darker. Good.
    detail: 0xFF5252,    // Red Glow (High Contrast)
    king: 0x9C27B0,      
    princess: 0x880E4F   
  },

  units: {
    primary: 0xD500F9, // Bright Magenta
  }
};

// Opsional: Export alias
export const factionBTheme = NOCTIS_THEME;