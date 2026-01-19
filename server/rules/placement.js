import { GRID, RIVER_ROW_START, RIVER_ROW_END } from "../../shared/constants.js";

/**
 * Memvalidasi apakah posisi spawn valid untuk tim tertentu.
 * @param {number} team - 0 (Bawah) atau 1 (Atas)
 * @param {number} col - Koordinat Grid X
 * @param {number} row - Koordinat Grid Y
 * @returns {boolean} True jika valid
 */
export function isValidPlacement(team, col, row) {
  // 1. Cek Batas Board (Out of Bounds)
  if (col < 0 || col >= GRID.cols) return false;
  if (row < 0 || row >= GRID.rows) return false;

  // 2. Cek Zona Wilayah (Territory Check)
  // Area Spawn tidak boleh di Sungai atau di Wilayah Musuh.
  
  if (team === 0) {
    // === TEAM 0 (BAWAH) ===
    // Hanya boleh spawn dari Row 0 sampai sebelum Sungai
    // RIVER_ROW_START = 16. Jadi max row = 15.
    return row < RIVER_ROW_START;
  
  } else if (team === 1) {
    // === TEAM 1 (ATAS) ===
    // Hanya boleh spawn dari Row setelah Sungai sampai Row 33
    // RIVER_ROW_END = 18. Jadi min row = 18.
    return row >= RIVER_ROW_END;
  }

  return false;
}

/**
 * (Opsional) Fungsi helper untuk mendapatkan pesan error
 */
export function getPlacementError(team, col, row) {
    if (!isValidPlacement(team, col, row)) {
        return "Invalid Placement: Cannot spawn in river or enemy territory.";
    }
    return null;
}