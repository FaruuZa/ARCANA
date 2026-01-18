export function cleanupSystem(state) {
  state.units = state.units.filter((u) => u.hp > 0);
  state.buildings = state.buildings.filter((b) => b.hp > 0);

  const deadTower = state.buildings.find((b) => b.hp <= 0);
  if (deadTower) {
    state.phase = "ended";
    state.winner = deadTower.team === 0 ? 1 : 0;
  }
}
