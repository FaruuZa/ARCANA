import { initBoard } from "./board.js";
import { initUnits } from "./units.js";
import { initTowers } from "./towers.js";

import { factionATheme } from "./themes/solaris.js";

export function initRenderer(app) {
  const theme = factionATheme; // nanti dari gameState.faction

  initBoard(app, theme);
  initTowers(app, theme);
  initUnits(app);
}
