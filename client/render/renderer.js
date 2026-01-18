import { initBoard } from "./board.js";
import { initUnits } from "./units.js";
import { initTowers } from "./towers.js";
import {initProjectiles} from "./projectiles.js";

import { SOLARIS_THEME } from "./themes/solaris.js";
import { createGrid } from "../utils/grid.js";

export function initRenderer(app) {
  const theme = SOLARIS_THEME; // nanti dari gameState.faction
  const grid = createGrid(app);

  initBoard(app, grid);
  initTowers(app, grid, theme);
  initUnits(app, grid);
  initProjectiles(app, grid);
}
