export function canPlace(team, x, y, type) {
  if (type === "RITUAL") return true;
  if (team === 0 && y < 350) return false;
  if (team === 1 && y > 350) return false;
  return true;
}
