import { GRID, RIVER_ROW_START, RIVER_ROW_END } from "../../shared/constants.js";

// Format: {col, row_offset_from_base}
const TOWER_LOCATIONS = [
    { col: 3, rowOffset: 6 },   // Left Side
    { col: 9, rowOffset: 3 },   // King
    { col: 15, rowOffset: 6 }   // Right Side
];

// Constants for Sanctum Placement
const MIN_BUILDING_DIST = 1.0;

const TOWER_BLOCK_RADIUS = 1.5; // Radius area terlarang di sekitar tower

/**
 * Memvalidasi apakah posisi spawn valid untuk tim tertentu.
 */
export function isValidPlacement(team, col, row) {
  // 1. Cek Batas Board (Out of Bounds)
  if (col < 0 || col >= GRID.cols) return false;
  if (row < 0 || row >= GRID.rows) return false;

  // 2. Cek Zona Wilayah (Territory Check)
  if (team === 0) {
    if (row >= RIVER_ROW_START) return false;
  } else if (team === 1) {
    if (row < RIVER_ROW_END) return false;
  }

  // 3. [NEW] Cek Tabrakan dengan Tower Statis
  // Kita cek apakah posisi spawn terlalu dekat dengan tower milik tim sendiri
  // (Tower musuh sudah tercover oleh territory check di atas)
  
  // Hitung posisi Y tower berdasarkan team
  // Team 0: y = offset. Team 1: y = (Rows-1) - offset.
  for (const tower of TOWER_LOCATIONS) {
      const towerRow = (team === 0) ? tower.rowOffset : (GRID.rows - 1) - tower.rowOffset;
      const towerCol = tower.col;

      // Hitung jarak Euclidean sederhana
      const dx = col - towerCol;
      const dy = row - towerRow;
      const dist = Math.sqrt(dx*dx + dy*dy);

      // Jika terlalu dekat, invalid
      if (dist < TOWER_BLOCK_RADIUS) {
          return false;
      }
  }

  return true;
}

/**
 * Validates no overlap with existing buildings (for Sanctums).
 */
export function isValidBuildingPlacement(gameState, col, row, radius = 1.0) {
    if (!gameState || !gameState.buildings) return true; // Safety

    // Check against all existing buildings
    for (const b of gameState.buildings) {
        if (b.hp <= 0) continue;
        
        // Simple circle collision
        const dx = col - b.col;
        const dy = row - b.row;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Allowed min distance (radius + radius)
        // Assume default building radius if not set? usually 1.0
        const bRadius = b.radius || 1.0;
        
        if (dist < (radius + bRadius)) {
            return false;
        }
    }
    return true;
}

export function getPlacementError(team, col, row) {
    if (!isValidPlacement(team, col, row)) {
        return "Invalid Placement: Restricted area.";
    }
    return null;
}