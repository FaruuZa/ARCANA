import { BASE_SPEED_TILES_PER_SEC } from "../../shared/constants.js";

export function createUnit(data) {
  return {
    // ... properti identitas ...
    id: data.id,
    team: data.team,       
    cardId: data.cardId, 
    // ... properti posisi ...
    lane: data.lane,       
    col: data.col,         
    row: data.row,         
    
    // ... stats dasar ...
    hp: data.hp ?? 100,
    maxHp: data.hp ?? 100,
    damage: data.damage,
    range: data.range,
    sightRange: data.sightRange || 5.0,
    speed: data.speed ?? BASE_SPEED_TILES_PER_SEC,
    attackSpeed: data.attackSpeed ?? 1.0,

    deployTime: data.deployTime || 1.0,
    aimTime: data.aimTime || 0.5,
    attackCooldown: 0,

    // === TARGETING MODULES ===
    movementType: data.movementType || 'ground', // Default ground
    targetTeam: data.targetTeam || 'enemy',      // Default enemy (Penyebab Healer error kemarin)
    targetRule: data.targetRule || 'any',        // Default any (Penyebab Siege error kemarin)
    targetHeight: data.targetHeight || 'both',   // Default both,

    // === OPTIONAL STATS ===
    aoeRadius: data.aoeRadius || 0,
    aoeType: data.aoeType || 'target',
    projectileType: data.projectileType || null,

    // Tipe Entity (Penting untuk membedakan Unit vs Building saat filtering)
    entityType: 'unit', 

    state: 'spawning', 
    stateTimer: data.deployTime || 1.0, 

    intent: {
      type: 'idle', // 'idle' (default/lane push), 'engage' (kejar/serang target)
      targetId: null
    },
    
    isCrossing: false,
    isDead: false
  };
}