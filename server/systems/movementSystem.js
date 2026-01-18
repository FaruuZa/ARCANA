import { GRID } from "../../shared/constants.js"; // Sesuaikan path import

export function updateMovement(gameState, dt) {
  for (const unit of gameState.units) {
    if (unit.hp <= 0) continue;

    // ❗ STOP kalau punya target
    if (unit.targetId !== null) continue;

    // Arah berdasarkan team
    // Team 0: Bergerak POSITIF (0 -> 16)
    // Team 1: Bergerak NEGATIF (16 -> 0)
    const direction = unit.team === 0 ? 1 : -1;

    // Update posisi ROW
    unit.row += unit.speed * direction * dt;

    // Clamp posisi agar tidak keluar board
    unit.row = Math.max(0, Math.min(GRID.rows, unit.row));

    // [TRANSISI] Update rowProgress untuk Client
    // Client saat ini merender berdasarkan 0.0 - 1.0, jadi kita hitung mundur
    unit.rowProgress = unit.row / GRID.rows;
  }
}