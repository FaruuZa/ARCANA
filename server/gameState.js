import { GRID, LANE_COLUMNS, BASE_SPEED_TILES_PER_SEC, DECK_SIZE, HAND_SIZE, PREP_DURATION, TOWER_POSITIONS } from "../shared/constants.js";
import { createBuilding } from "./entity/building.js"; // [FIX] Import
import { createUnit } from "./entity/unit.js";
import { SpatialHash } from "./utils/spatialHash.js";

import { CARDS } from "../shared/data/cards.js"; // [NEW] Need CARDS for auto-fill

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
    ready: false // [NEW] Status Deck Submitted
  };
}



// Helper: Create Towers
function createTowers(startId) {
  const towers = [];
  let id = startId;

  // Team 0 (Bottom)
  // King Tower
  towers.push(createBuilding({
    id: id++,
    team: 0,
    type: 'king',
    col: TOWER_POSITIONS.KING_COL,
    row: TOWER_POSITIONS.KING_ROW_OFFSET,
    hp: 4000,
    damage: 20,
    range: 7.0,
    radius: 1.5
  }));

  // Side Towers
  towers.push(createBuilding({
    id: id++,
    team: 0,
    type: 'side',
    col: TOWER_POSITIONS.SIDE_LEFT_COL,
    row: TOWER_POSITIONS.SIDE_ROW_OFFSET,
    hp: 2500,
    damage: 15,
    range: 7.5
  }));
  
  towers.push(createBuilding({
    id: id++,
    team: 0,
    type: 'side',
    col: TOWER_POSITIONS.SIDE_RIGHT_COL,
    row: TOWER_POSITIONS.SIDE_ROW_OFFSET,
    hp: 2500,
    damage: 15,
    range: 7.5
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
    hp: 4000,
    damage: 20,
    range: 7.0,
    radius: 1.5
  }));

  // Side Towers
  towers.push(createBuilding({
    id: id++,
    team: 1,
    type: 'side',
    col: TOWER_POSITIONS.SIDE_LEFT_COL,
    row: TOP_ROW - TOWER_POSITIONS.SIDE_ROW_OFFSET,
    hp: 2500,
    damage: 15,
    range: 7.5
  }));

  towers.push(createBuilding({
    id: id++,
    team: 1,
    type: 'side',
    col: TOWER_POSITIONS.SIDE_RIGHT_COL,
    row: TOP_ROW - TOWER_POSITIONS.SIDE_ROW_OFFSET,
    hp: 2500,
    damage: 15,
    range: 7.5
  }));

  return towers;
}

export function createGameState() {
  const nextId = 1;
  const towers = createTowers(nextId);
  
  return {
    tick: 0,
    phase: "preparation", // [NEW] Start at Prep
    prepEndTime: Date.now() + PREP_DURATION, // [NEW] Timer
    
    players: {
      0: createPlayerState('solaris'),
      1: createPlayerState('noctis')
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
    disconnectedTeam: -1
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
    
    state.units.push(unit);
    return unit;
}