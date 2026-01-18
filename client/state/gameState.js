const listeners = new Set();

export const gameState = {
  data: {
    phase: "loading",
    players: {},
    units: [],
    buildings: [],
    projectiles: [],
    arcana: 0
  },

  set(newState) {
    this.data = newState;
    listeners.forEach(fn => fn(this.data));
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};
