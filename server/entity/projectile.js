// server/entity/projectile.js

export function createProjectile(data) {
  return {
    id: data.id,
    team: data.team,
    ownerId: data.ownerId, // Unit yang menembak
    targetId: data.targetId, // Unit yang ditarget
    
    // Posisi Awal
    row: data.row,
    col: data.col,
    
    // Properti
    speed: data.speed ?? 10.0,
    damage: data.damage ?? 10,
    type: data.type ?? 'arrow', // visual type
    
    // State
    hasHit: false
  };
}