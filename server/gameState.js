import { createTower } from "./entity/building.js";


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
    buildings: [
      createTower({ id: 1000, team: 0 }),
      createTower({ id: 1001, team: 1 })
    ],
    projectiles: [],

    nextEntityId: 1002
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

