const listeners = new Set();

export let myTeamId = -1;

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
  setMyTeam(id) {
    myTeamId = id;
    console.log("I am now playing as Team:", id);
  },
  
  // Getter
  getMyTeam() {
    return myTeamId;
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};
