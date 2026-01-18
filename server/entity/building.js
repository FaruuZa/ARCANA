export function createTower({ id, team }) {
  return {
    id,
    team,
    type: "tower",

    lane: null,          // tower tidak di lane
    progress: team === 0 ? 1 : 0, // ujung board

    hp: 1000,
    maxHp: 1000,

    range: 0.25,
    damage: 40,
    attackCooldown: 1.2,
    attackTimer: 0,

    targetId: null
  };
}
