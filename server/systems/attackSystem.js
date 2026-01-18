export function updateAttacks(gameState, dt) {
  const units = gameState.units;

  for (const unit of units) {
    if (unit.hp <= 0) continue;
    if (unit.targetId === null) continue;

    const target = units.find(u => u.id === unit.targetId);
    if (!target || target.hp <= 0) {
      unit.targetId = null;
      continue;
    }

    const dist = Math.abs(unit.progress - target.progress);

    // ❗ Gunakan attackRange, bukan sightRange
    if (dist > unit.attackRange) continue;

    unit.attackCooldown -= dt;
    if (unit.attackCooldown > 0) continue;

    // SERANG
    target.hp -= unit.damage;
    unit.attackCooldown = unit.attackSpeed;
  }
}
