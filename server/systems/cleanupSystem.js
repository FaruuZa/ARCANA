export function cleanupSystem(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const effects = gameState.effects;

  // 1. Hapus Unit Mati
  for (let i = units.length - 1; i >= 0; i--) {
    if (units[i].hp <= 0) {
      units.splice(i, 1);
    }
  }

  // 2. Hapus Building Mati & Cek King Tower
  for (let i = buildings.length - 1; i >= 0; i--) {
    const b = buildings[i];
    
    if (b.hp <= 0) {
      // CEK: Apakah ini King Tower?
      if (b.type === 'king') {
        // Jika King Team 0 mati, Pemenang adalah Team 1 (dan sebaliknya)
        gameState.winner = (b.team === 0) ? 1 : 0;
        gameState.phase = "ended";
      }
      
      buildings.splice(i, 1);
    }
  }

  // === CLEANUP EFFECTS ===
  for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      
      // Kurangi timer (Kita butuh dt disini! Pastikan pass dt ke cleanupSystem)
      // Jika dt belum dipassing dari gameLoop, sementara pakai angka fix 0.1 atau ubah gameLoop
      if (typeof dt !== 'undefined') {
          effect.time -= dt;
      } else {
          effect.time -= 0.1; // Fallback kalau lupa update gameLoop
      }

      if (effect.time <= 0) {
          effects.splice(i, 1);
      }
  }
}