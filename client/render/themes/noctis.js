import { baseTheme } from "./baseTheme.js";

export const NOCTIS_THEME = {
  ...baseTheme,

  board: {
    // Background gelap (Ungu tua kehitaman)
    background: 0x241e2b, 
    // Sungai (Merah gelap/darah atau ungu beracun untuk Noctis)
    river: 0x4a2838,
    // Grid line lebih tipis/gelap
    laneLine: 0x554466,
  },

  tower: {
    friendly: 0xaa55aa, // Ungu
    enemy: 0xff4444,    // Merah
  }
};