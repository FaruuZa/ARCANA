import { GRID, LANE_COLUMNS, BASE_SPEED_TILES_PER_SEC } from "../shared/constants.js";
import { createBuilding } from "./entity/building.js";
import { createUnit } from "./entity/unit.js";

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

// Helper: Buat Deck Starter
function createStarterDeck() {
  const deck = [
      "vessel_01", "vessel_02", "ritual_01", "vessel_siege",
      "vessel_01", "vessel_healer", "vessel_healer", "ritual_01"
  ];
  return shuffle(deck);
}

export function createGameState() {
  let nextId = 1000;
  const towers = [];

  // Helper Setup Tower
  const addTower = (team, type, col, rowOffset) => {
    const row = team === 0 ? rowOffset : (GRID.rows - 1) - rowOffset; 
    towers.push(createBuilding({
      id: nextId++, team, type, col, row,
      hp: type === 'king' ? 3000 : 1500,
      range: type === 'king' ? 5.5 : 4.5
    }));
  };

  // Setup Tower (Posisi Final)
  [0, 1].forEach(team => {
    addTower(team, 'side', 2, 6);
    addTower(team, 'king', 9, 2);
    addTower(team, 'side', 16, 6);
  });

  // --- INITIALIZE PLAYERS DENGAN HAND & DECK ---
  const players = {};
  [0, 1].forEach(team => {
      const fullDeck = createStarterDeck();
      
      // Ambil 4 kartu pertama sebagai Hand
      const hand = fullDeck.splice(0, 4);
      
      // Ambil 1 kartu berikutnya sebagai Next
      const nextCard = fullDeck.pop();

      players[team] = {
        id: null,
        faction: team === 0 ? 'solaris' : 'noctis',
        arcana: 5, // Modal awal 5
        maxArcana: 10,
        
        // State Kartu Baru
        deck: fullDeck, 
        hand: hand,     
        next: nextCard  
      };
  });

  return {
    tick: 0,
    phase: "battle",
    players: players,
    winner: null,
    units: [],
    buildings: towers,
    projectiles: [],
    effects: [], // Menyimpan data visual sementara (ledakan, spawn, dll)
    nextEntityId: nextId
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

        movementType: data.movementType,
        targetTeam: data.targetTeam,     // <--- Ini yang bikin Healer error
        targetRule: data.targetRule,     // <--- Ini yang bikin Siege error
        targetHeight: data.targetHeight
    });
    
    state.units.push(unit);
}