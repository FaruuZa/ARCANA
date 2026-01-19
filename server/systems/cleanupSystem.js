export function cleanupSystem(gameState) {
  const units = gameState.units;
  const buildings = gameState.buildings;

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
}