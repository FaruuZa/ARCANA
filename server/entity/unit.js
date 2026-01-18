// server/entity/unit.js
import { BASE_SPEED_TILES_PER_SEC } from "../../shared/constants.js";

export function createUnit(data) {
  return {
    // Identitas
    id: data.id,
    team: data.team,       // 0 atau 1
    cardId: data.cardId,   // ID Kartu (misal: 'knight', 'archer')
    
    // Posisi (Grid System)
    lane: data.lane,       // Lane Logic (0, 1, 2)
    col: data.col,         // Grid Column (0-18)
    row: data.row,         // Grid Row (0-33)
    
    // Legacy support (untuk client transisi)
    rowProgress: 0,        // Nanti dihitung movementSystem
    offsetX: 0,
    offsetY: 0,

    // Stats Combat
    hp: data.hp ?? 100,
    maxHp: data.hp ?? 100,
    damage: data.damage ?? 10,
    range: data.range ?? 1.0, // Jarak serang (kotak)
    speed: data.speed ?? BASE_SPEED_TILES_PER_SEC,
    attackSpeed: data.attackSpeed ?? 1.0, // Detik per serangan
    
    // State Dinamis
    attackCooldown: 0,
    targetId: null,
    isDead: false
  };
}