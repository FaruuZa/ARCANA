export function createProjectile(data) {
  return {
    id: data.id,
    ownerId: data.ownerId,
    targetId: data.targetId, // Target spesifik (untuk homing missile)
    
    // Posisi & Gerakan
    col: data.col,
    row: data.row,
    speed: data.speed,
    
    // Stats Combat
    damage: data.damage,
    team: data.team,
    
    // Tipe & Visual
    type: data.type || "arrow", // 'arrow', 'fireball', 'cannonball'
    
    // Area of Effect
    aoeRadius: data.aoeRadius || 0,
    
    // Targeting Rules (diwariskan dari Unit penembak)
    targetHeight: data.targetHeight || 'both',
    
    // [NEW] DAFTAR BUFF YANG DIBAWA PELURU
    // Array of objects: [{ type: 'slow', val: 0.5, dur: 2.0, ... }]
    onHitEffects: data.onHitEffects || [],

    isDead: false
  };
}