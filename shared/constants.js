export const GRID = {
  cols: 19,
  rows: 34,
}

// Lane 0 (Kiri)   : Col 2  (Menyisakan Col 0 & 1 sebagai gap/dekorasi)
// Lane 1 (Tengah) : Col 9  (Tepat di tengah)
// Lane 2 (Kanan)  : Col 16 (Menyisakan Col 17 & 18 sebagai gap)
export const LANE_COLUMNS = {
  0: 3, 
  1: 9, 
  2: 15  
};

// --- UPDATE JEMBATAN FISIK ---
export const BRIDGE_COLUMNS = [3, 15]; 

export const RIVER_ROW_START = 16;
export const RIVER_ROW_END = 18;
export const BRIDGE_ROWS = [16, 17];

// --- DEFINISI POSISI TOWER BARU ---
export const TOWER_POSITIONS = {
  KING_COL: 9, // Tengah
  SIDE_LEFT_COL: 3,
  SIDE_RIGHT_COL: 15,

  // Maju = Angka Offset Lebih Besar (Mendekati sungai)
  // Mundur = Angka Offset Lebih Kecil (Mendekati base

  // Offset dari base
  KING_ROW_OFFSET: 3,
  SIDE_ROW_OFFSET: 8, 
};

export const BASE_SPEED_TILES_PER_SEC = 5.0;
export const MAX_ARCANA = 10;
export const ARCANA_REGEN_PER_SEC = 0.5;

// --- PHYSICS CONSTANTS ---
export const UNIT_RADIUS_DEFAULT = 0.5;
export const BUILDING_RADIUS = 1.0;
// --- DECK BUILDING ---
export const DECK_SIZE = 10;
export const HAND_SIZE = 5;
export const PREP_DURATION = 60; // 60s
export const MAX_TABOO_CARDS = 2; // Opsional limit