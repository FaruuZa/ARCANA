import { initBoard } from "./board.js";
import { initTowers } from "./towers.js";
import { initGhost } from "./ghost.js";
import { initUnits, syncUnits } from "./units.js";
import { initEffects, syncEffects} from "./effects.js";
import {initProjectiles, syncProjectiles} from "./projectiles.js";

import { createGrid } from "../utils/grid.js";
import { gameState } from "../state/gameState.js";

export function initRenderer(app) {
  const grid = createGrid(app);

  initBoard(app, grid);
  initTowers(app, grid);
  initGhost(app, grid);
  

  const unitSystem = initUnits(app, grid);
  const projSystem = initProjectiles(app, grid);
  const effectSystem = initEffects(app, grid);

  app.ticker.add(() => {
      // AMBIL DATA INTERPOLASI (HALUS)
      const renderState = gameState.getRenderState();
      
      if (!renderState) return;

      // UPDATE VISUAL MENGGUNAKAN DATA HALUS
      syncUnits(renderState.units || [], unitSystem.layer);
      syncProjectiles(renderState.projectiles || [], projSystem.layer);
      syncEffects(renderState.effects || [], effectSystem.layer);
  });
}
