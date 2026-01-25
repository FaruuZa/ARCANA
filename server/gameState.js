import { GRID, LANE_COLUMNS, BASE_SPEED_TILES_PER_SEC, DECK_SIZE, HAND_SIZE, PREP_DURATION, TOWER_POSITIONS } from "../shared/constants.js";
import { createBuilding } from "./entity/building.js"; // [FIX] Import
import { createUnit } from "./entity/unit.js";
import { SpatialHash } from "./utils/spatialHash.js";

import { CARDS } from "../shared/data/cards.js"; // [NEW] Need CARDS for auto-fill
import { FACTIONS } from "../shared/data/factions.js"; // [NEW] Faction Stats

// Helper: Acak Array
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Helper: Buat Deck Starter (AUTO-FILL)
// Digunakan jika user tidak memilih deck sampai waktu habis
export function createRandomDeck(faction) {
  const validCards = Object.values(CARDS).filter(c => {
    // Logic Faction Validation
    if (!c.isToken) return true;
    if (c.minFaction === 'neutral') return true;
    if (c.minFaction === faction) return true;
    return false;
  });

  // Taboo logic (Optional limit) could go here but kept simple for auto-fill

  const deck = [];
  while (deck.length < DECK_SIZE && validCards.length > 0) {
    const idx = Math.floor(Math.random() * validCards.length);
    deck.push(validCards[idx].id);
    // Allow duplicates? Or unique for starter?
    // Usually unique is safer for variety
    validCards.splice(idx, 1);
  }
  return deck;
}

// Helper: Create Player State
function createPlayerState(faction) {
  // Deck Kosong di awal (Menunggu Submit)
  return {
    id: null,
    faction: faction,
    arcana: 5,
    maxArcana: 10,

    // NEW DECK SYSTEM
    deck: [], // Pool of 10 Cards
    hand: [], // 5 Cards

    connected: false,
    ready: false, // [NEW] Status Deck Submitted

    // [NEW] Taboo Global Modifiers
    modifiers: {
      arcanaRate: FACTIONS[faction] ? FACTIONS[faction].arcanaRate : 1.0,
      towerDamage: 1.0,
      towerHp: 1.0
    }
  };
}



// Helper: Create Towers
export function createTowers(startId, factions) {
  const towers = [];
  let id = startId;

  const f0 = FACTIONS[factions[0]];
  const f1 = FACTIONS[factions[1]];

  // Team 0 (Bottom)
  // King Tower
  towers.push(createBuilding({
    id: id++,
    team: 0,
    type: 'king',
    col: TOWER_POSITIONS.KING_COL,
    row: TOWER_POSITIONS.KING_ROW_OFFSET,
    hp: f0.towerStats.king.hp,
    damage: f0.towerStats.king.damage,
    range: f0.towerStats.king.range,
    radius: f0.towerStats.king.radius
  }));

  // Side Towers
  towers.push(createBuilding({
    id: id++,
    team: 0,
    type: 'side',
    col: TOWER_POSITIONS.SIDE_LEFT_COL,
    row: TOWER_POSITIONS.SIDE_ROW_OFFSET,
    hp: f0.towerStats.side.hp,
    damage: f0.towerStats.side.damage,
    range: f0.towerStats.side.range
  }));

  towers.push(createBuilding({
    id: id++,
    team: 0,
    type: 'side',
    col: TOWER_POSITIONS.SIDE_RIGHT_COL,
    row: TOWER_POSITIONS.SIDE_ROW_OFFSET,
    hp: f0.towerStats.side.hp,
    damage: f0.towerStats.side.damage,
    range: f0.towerStats.side.range
  }));

  // Team 1 (Top)
  const TOP_ROW = GRID.rows - 1;

  // King Tower
  towers.push(createBuilding({
    id: id++,
    team: 1,
    type: 'king',
    col: TOWER_POSITIONS.KING_COL,
    row: TOP_ROW - TOWER_POSITIONS.KING_ROW_OFFSET,
    hp: f1.towerStats.king.hp,
    damage: f1.towerStats.king.damage,
    range: f1.towerStats.king.range,
    radius: f1.towerStats.king.radius
  }));

  // Side Towers
  towers.push(createBuilding({
    id: id++,
    team: 1,
    type: 'side',
    col: TOWER_POSITIONS.SIDE_LEFT_COL,
    row: TOP_ROW - TOWER_POSITIONS.SIDE_ROW_OFFSET,
    hp: f1.towerStats.side.hp,
    damage: f1.towerStats.side.damage,
    range: f1.towerStats.side.range
  }));

  towers.push(createBuilding({
    id: id++,
    team: 1,
    type: 'side',
    col: TOWER_POSITIONS.SIDE_RIGHT_COL,
    row: TOP_ROW - TOWER_POSITIONS.SIDE_ROW_OFFSET,
    hp: f1.towerStats.side.hp,
    damage: f1.towerStats.side.damage,
    range: f1.towerStats.side.range
  }));

  return towers;
}

export function createGameState() {
  const nextId = 1;
  // [NEW] Random Faction Assignment based on Enabled Flag
  let pool = Object.keys(FACTIONS).filter(key => FACTIONS[key].enabled);

  // Ensure we have at least 2 unique factions for a non-mirror match
  if (pool.length < 2) {
    console.warn("Not enough enabled factions for unique match. Enabling all factions.");
    pool = Object.keys(FACTIONS);
  }

  // Shuffle Pool (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Select first two distinct factions
  // pool is guaranteed to have >= 2 elements as long as FACTIONS has >= 2 keys
  const factions = [pool[0], pool[1]];

  const towers = createTowers(nextId, factions);

  return {
    tick: 0,
    phase: "deck_building", // [NEW] Start at Deck Building
    prepEndTime: 0, // Reset, will be set when game actually starts (curtain drops)

    players: {
      0: createPlayerState(factions[0]),
      1: createPlayerState(factions[1])
    },

    // ...
    winner: null,
    units: [],
    buildings: towers,
    projectiles: [],
    effects: [],
    activeSpells: [],
    spatialHash: new SpatialHash(2.0),
    nextEntityId: nextId + towers.length + 1,
    rematchCount: 0,
    paused: false,
    pauseReason: null,
    pauseEndTime: null,
    disconnectedTeam: -1,

    activeOmen: null // [NEW] Omen Slot
  };
}

export function spawnUnit(state, data) {

  const startRow = data.row ?? (data.team === 0 ? 0 : 33);
  const startCol = data.col ?? 9;

  // Auto-Lane Logic (Tetap diperlukan untuk AI Pathfinding movement)
  let assignedLane = 1;
  if (startCol < 6) assignedLane = 0;
  else if (startCol > 12) assignedLane = 2;

  const unit = createUnit({
    id: state.nextEntityId++,
    team: data.team,
    cardId: data.cardId,

    lane: assignedLane, // Metadata untuk movement
    row: startRow,      // Posisi Akurat
    col: startCol,      // Posisi Akurat

    hp: data.hp,
    damage: data.damage,
    range: data.range,
    speed: data.speed,
    attackSpeed: data.attackSpeed,
    deployTime: data.deployTime,
    aimTime: data.aimTime,
    count: data.count || 1,
    spawnRadius: data.spawnRadius || 0.5,

    // Required Stats
    movementType: data.movementType,
    targetTeam: data.targetTeam,
    targetRule: data.targetRule,
    targetHeight: data.targetHeight,

    // Optional Stats
    aoeRadius: data.aoeRadius || 0,
    aoeType: data.aoeType || 'target', // 'target' | 'self'
    projectileType: data.projectileType || null,
    traits: data.traits || {},


  });

  // [NEW] Global Silence Omen Check
  if (state.activeOmen && state.activeOmen.id === 'global_silence') {
    if (!unit.buffs) unit.buffs = [];
    unit.buffs.push({
      name: "Global Silence",
      type: "silence",
      value: 1,
      duration: 9999, // Permanent/Match Duration
      sourceId: -1,
      tickTimer: 0
    });
  }

  // [NEW] Global Poison Omen Check
  if (state.activeOmen && state.activeOmen.id === 'global_poison') {
    if (!unit.buffs) unit.buffs = [];
    unit.buffs.push({
      name: "Global Poison",
      type: "poison",
      value: state.activeOmen.value || 10, // Default 10 per tick
      duration: 9999,
      sourceId: -1,
      tickTimer: 0.5 // Start immediately (next tick)
    });
  }

  state.units.push(unit);
  return unit;
}

export function spawnBuilding(state, data) {
  const building = createBuilding({
    id: state.nextEntityId++,
    team: data.team,
    type: data.type || 'sanctum', // Default type
    col: data.col,
    row: data.row,
    hp: data.hp,
    damage: data.damage,
    range: data.range,
    radius: data.radius,
    attackSpeed: data.attackSpeed, // [NEW] If buildings can attack
    traits: data.traits || {}
  });

  state.buildings.push(building);
  return building;
}