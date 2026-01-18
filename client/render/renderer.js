import { initBoard } from "./board.js";
import { initUnits } from "./units.js";
import { initTowers } from "./towers.js";

import { factionATheme } from "./themes/solaris.js";
import { createGrid } from "../utils/grid.js";

export function initRenderer(app) {
  const theme = factionATheme; // nanti dari gameState.faction
  const grid = createGrid(app);

  initBoard(app, grid);
  initTowers(app, grid, theme);
  initUnits(app, grid);
}
