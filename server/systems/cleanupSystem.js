export function cleanupSystem(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const effects = gameState.effects;

  // 1. CLEANUP UNITS & BUILDINGS
  // [MOVED] Logika penghapusan unit dipindah ke deathSystem.js (processDeaths)
  // agar onDeath effect sempat tereksekusi sebelum unit dihapus.

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