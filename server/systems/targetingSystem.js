export function updateTargeting(gameState) {
  const units = gameState.units;

  for (const unit of units) {
    // 1. Lewati unit mati
    if (unit.hp <= 0) continue;

    // 2. Jika masih punya target dan target masih hidup → biarkan
    if (unit.targetId !== null) {
      const target = units.find(u => u.id === unit.targetId);
      if (target && target.hp > 0) {
        continue;
      }

      // target sudah mati / hilang
      unit.targetId = null;
    }

    // 3. Cari target baru
    let closestTarget = null;
    let closestDist = Infinity;

    for (const other of units) {
      if (other.id === unit.id) continue;
      if (other.team === unit.team) continue;
      if (other.hp <= 0) continue;

      // 4. Aturan lane (melee lane-lock)
      if (other.lane !== unit.lane) continue;

      // 5. Hitung jarak logis di lane
      const dist = Math.abs(other.progress - unit.progress);

      // 6. Cek engagement range
      if (dist > unit.sightRange) continue;

      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = other;
      }
    }

    // 7. Set target jika ketemu
    if (closestTarget) {
      unit.targetId = closestTarget.id;
    }
  }
}
