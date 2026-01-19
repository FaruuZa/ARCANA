// server/entity/building.js

export function createBuilding(data) {
  return {
    // Identitas
    id: data.id,
    team: data.team,
    type: data.type, // 'king' atau 'side'
    
    // Posisi
    col: data.col,
    row: data.row,
    
    // Stats Combat
    hp: data.hp,
    maxHp: data.hp,
    damage: data.damage ?? 15,
    range: data.range ?? 5.0,
    attackSpeed: data.attackSpeed ?? 1.2,
    
    entityType: 'building',
    
    // State
    attackCooldown: 0,
    targetId: null,
    isDead: false
  };
}