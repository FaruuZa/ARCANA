import { baseTheme } from "./baseTheme.js";

export const SOLARIS_THEME = {
  ...baseTheme,

  board: {
    background: 0x8888ff,
    river: 0x3f6aa1,
    laneLine: 0xaaaaaa,
  },

  tower: {
    friendly: 0x88ff88,
    enemy: 0xff8888,
  }
};
