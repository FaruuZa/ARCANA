export function updateMovement(gameState, dt) {
  for (const unit of gameState.units) {
    if (unit.hp <= 0) continue;

    // ❗ STOP kalau punya target
    if (unit.targetId !== null) continue;

    // Arah berdasarkan team
    const dir = unit.team === 0 ? 1 : -1;

    if(unit.team === 0){
        unit.progress += unit.speed * dt;
    }else{
        unit.progress -= unit.speed * dt;
    }
    unit.rowProgress = unit.progress;

    // Clamp wajib
    unit.progress = Math.max(0, Math.min(1, unit.progress));
  }
}
