export function createGameState() {
  return {
    tick: 0,
    phase: "battle",

    players: {
      0: {
        id: null,
        faction: null,
        arcana: 10,
        maxArcana: 10
      },
      1: {
        id: null,
        faction: null,
        arcana: 10,
        maxArcana: 10
      }
    },

    units: [],
    buildings: [],
    projectiles: [],

    nextEntityId: 1
  };
}

export function spawnUnit(state, data) {
  const unit = {
    id: state.nextEntityId++,
    cardId: data.cardId,
    team: data.team,

    lane: data.lane ?? 0,
    progress: data.team === 0 ? 0 : 1,

    offsetX: 0,
    offsetY: 0,

    speed: data.speed ?? 0.15,
    hp: data.hp ?? 100,

    targetId: null
  };

  state.units.push(unit);
}

export function updateUnits(state, dt) {
  for (const unit of state.units) {

    // === GERAK MAJU DI LANE
    if (unit.team === 0) {
      unit.progress += unit.speed * dt;
    } else {
      unit.progress -= unit.speed * dt;
    }

    // === CLAMP (WAJIB)
    unit.progress = Math.max(0, Math.min(1, unit.progress));

    // === MICRO OFFSET (VISUAL / CHASE)
    unit.offsetX = 0;
    unit.offsetY = Math.sin(state.tick * 0.15 + unit.id) * 0.25;
  }
}
