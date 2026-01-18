export function worldToScreen(x, y, app) {
  return {
    x,
    y: y - app.screen.height / 2,
  };
}

export function laneToScreen(unit, app) {
  const LANE_Y_RATIO = [0.35, 0.65];
  const OFFSET_Y_MAX = 12;

  const lane = unit.lane ?? 0;
  const progress = unit.progress ?? 0;

  const laneY = app.screen.height * LANE_Y_RATIO[lane];

  const startX = unit.team === 0 ? 40 : app.screen.width - 40;
  const endX   = unit.team === 0 ? app.screen.width - 40 : 40;

  const x = startX + (endX - startX) * progress;
  const y = laneY + (unit.offsetY ?? 0) * OFFSET_Y_MAX;

  return { x, y };
}



