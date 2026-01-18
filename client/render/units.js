import { gameState } from "../state/gameState.js";
import {unitToScreen} from "../utils/grid.js"
import { worldToScreen, laneToScreen } from "../utils/utils.js";

const unitSprites = new Map();

let _app = null;

const CAMERA_OFFSET = {
  x: 0,
  y: -300,
};

export function initUnits(app) {
  const layer = new PIXI.Container();
  _app = app;
  layer.zIndex = 10;
  app.stage.addChild(layer);
  app.stage.sortableChildren = true;


  gameState.subscribe((state) => {
    syncUnits(state.units, layer);
  });
}

function syncUnits(units = [], layer) {
  const grid = _app ? createGrid(_app) : null;
  if (!layer.parent) return; // stage belum siap

  const aliveIds = new Set(units.map((u) => u.id));

  for (const [id, sprite] of unitSprites) {
    if (!aliveIds.has(id)) {
      sprite.destroy();
      unitSprites.delete(id);
    }
  }

  for (const unit of units) {
    let sprite = unitSprites.get(unit.id);

    if (!sprite) {
      sprite = createUnitSprite(unit);
      unitSprites.set(unit.id, sprite);
      layer.addChild(sprite);
    }

    const pos = unitToScreen(unit, grid);
    sprite.x = pos.x;
    sprite.y = pos.y;
  }
}

function createUnitSprite(unit, grid) {
  const g = new PIXI.Graphics();
  
  if (unit.team === 0) {
    g.beginFill(0x0000ff); // BIRU
  } else {
    g.beginFill(0xff0000); // MERAH
  }

  g.drawCircle(0, 0, 20);
  g.endFill();


  console.log("UNIT CREATED", unit.id);

  return g;
}
