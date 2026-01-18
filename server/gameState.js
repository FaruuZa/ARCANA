import { createBuilding } from "./entity/building.js";
import { createUnit } from "./entity/unit.js";
import { GRID, BASE_SPEED_TILES_PER_SEC, LANE_COLUMNS, TOWER_POSITIONS } from "../shared/constants.js";


export function createGameState() {
  let nextId = 1000;
  const towers = [];

  // Helper kecil untuk setup tower awal
  const addTower = (team, type, col, rowOffset) => {
    const row = team === 0 
      ? rowOffset 
      : (GRID.rows - 1) - rowOffset;
    towers.push(createBuilding({
      id: nextId++,
      team,
      type,
      col,
      row,
      hp: type === 'king' ? 3000 : 1500,
      range: type === 'king' ? 5.5 : 4.5
    }));
  };

  // Setup Tower Team 0 & 1
  [0, 1].forEach(team => {
    addTower(team, 'side', TOWER_POSITIONS.SIDE_LEFT_COL, TOWER_POSITIONS.SIDE_ROW_OFFSET);
    addTower(team, 'king', TOWER_POSITIONS.KING_COL, TOWER_POSITIONS.KING_ROW_OFFSET);
    addTower(team, 'side', TOWER_POSITIONS.SIDE_RIGHT_COL, TOWER_POSITIONS.SIDE_ROW_OFFSET);
  });

  return {
    tick: 0,
    phase: "battle",
    players: {
      0: { id: null, faction: null, arcana: 10, maxArcana: 10 },
      1: { id: null, faction: null, arcana: 10, maxArcana: 10 }
    },
    units: [],
    buildings: towers,
    projectiles: [],
    nextEntityId: nextId
  };
}

export function spawnUnit(state, data) {
  const startRow = data.team === 0 
    ? 0 
    : (GRID.rows - 1);
  const startCol = LANE_COLUMNS[data.lane ?? 1];

  // Menggunakan Factory 'createUnit'
  const unit = createUnit({
    id: state.nextEntityId++,
    team: data.team,
    cardId: data.cardId,
    
    lane: data.lane ?? 1,
    row: startRow,
    col: startCol,
    
    hp: data.hp ?? 100,
    damage: data.damage ?? 10,
    range: data.range ?? 1.5, // Default range melee
    speed: data.speed ?? BASE_SPEED_TILES_PER_SEC,
    attackSpeed: 1.0
  });

  state.units.push(unit);
}