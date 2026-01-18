import { gameState } from "../state/gameState.js";
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

  // setTimeout(() => {
  //   syncUnits(
  //     [
  //       {
  //         id: "__debug_unit__",
  //         x: 300,
  //         y: 300,
  //         team: 0,
  //       },
  //     ],
  //     layer,
  //   );
  // }, 1000);

  gameState.subscribe((state) => {
    console.log("FULL STATE:", state);
    console.log("UNITS ARRAY:", state.units, "length:", state.units?.length);
    syncUnits(state.units, layer);
  });
}

function syncUnits(units = [], layer) {
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

    const pos = laneToScreen(unit, _app);
    sprite.x = pos.x;
    sprite.y = pos.y;
  }
}

function createUnitSprite(unit) {
  const g = new PIXI.Graphics();

  g.beginFill(0xff0000); // MERAH
  g.drawCircle(0, 0, 20);
  g.endFill();

  // PAKSA KE TENGAH
  g.x = 50;
  g.y = 50;

  console.log("UNIT CREATED", unit.id);

  return g;
}
