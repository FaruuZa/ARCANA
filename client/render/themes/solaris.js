import { baseTheme } from "./baseTheme.js";

export const factionATheme = {
  ...baseTheme,

  board: {
    background: 0x1b1f2a,
    river: 0x3f6aa1,
    laneLine: 0xaaaaaa,
  },

  tower: {
    friendly: 0x88ff88,
    enemy: 0xff8888,
  }
};
