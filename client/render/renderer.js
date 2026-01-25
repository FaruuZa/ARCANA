import { initBoard } from "./board.js";
import { initTowers } from "./towers.js";
import { initGhost } from "./ghost.js";
import { initUnits, syncUnits } from "./units.js";
import { initEffects, syncEffects } from "./effects.js";
import { initProjectiles, syncProjectiles } from "./projectiles.js";
import { createFloatingLabel } from "./effects.js";
import { unitToScreen } from "../utils/grid.js";
import { getSocket } from "../net/socket.js"; // [FIX] Correct Import

import { createGrid, updateGrid } from "../utils/grid.js";
import { gameState } from "../state/gameState.js";

export function initRenderer(app) {
  const grid = createGrid(app);

  const boardSystem = initBoard(app, grid); // Capture return
  const towerSystem = initTowers(app, grid); // Capture return
  initGhost(app, grid);

  const unitSystem = initUnits(app, grid);
  const projSystem = initProjectiles(app, grid);
  const effectSystem = initEffects(app, grid);

  // [NEW] Listen for Card Usage
  // Clean up previous listeners
  const socket = getSocket();
  if (socket) {
    socket.off('card_used');

    socket.on('card_used', (data) => {
      // data: { name, isTaboo, col, row, team }
      const pos = unitToScreen({ col: data.col, row: data.row }, grid);
      createFloatingLabel(pos.x, pos.y, data.name, data.isTaboo);
    });
  }
  // [NEW] HANDLE RESIZE
  app.renderer.on('resize', () => {
    updateGrid(grid, app);
    if (boardSystem.resize) boardSystem.resize();
    if (towerSystem.resize) towerSystem.resize();
    // Units, Projectiles, Effects are updated in Ticker -> syncUnits, 
    // but syncUnits logic uses unitToScreen(unit, grid).
    // creating new sprites uses grid? No just positions.
    // sync logic runs every frame? 
    // Yes app.ticker runs every frame.
    // So dynamic units will auto-correct on next frame because they calculate pos from grid each time?
    // Let's check syncUnits in units.js.
  });

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
