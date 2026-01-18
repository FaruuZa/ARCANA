import { distance } from "../utils/math.js";

export function updateProjectiles(gameState, dt) {
  const projectiles = gameState.projectiles;
  const allTargets = [...gameState.units, ...gameState.buildings];

  // Loop terbalik agar aman saat menghapus array (splice)
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    
    // 1. Cari target terkini (Homing Missile Logic)
    // Jika target mati/hilang, peluru lanjut ke posisi terakhir (atau dihapus)
    const target = allTargets.find(e => e.id === proj.targetId);
    
    if (!target || target.hp <= 0) {
      // Opsi A: Hapus peluru jika target hilang
      projectiles.splice(i, 1);
      continue;
    }

    // 2. Gerakkan Projectile menuju Target
    // Vector movement sederhana
    const dRow = target.row - proj.row;
    const dCol = target.col - proj.col;
    const dist = Math.sqrt(dRow*dRow + dCol*dCol);

    // Gerakkan
    if (dist > 0) {
        const moveStep = proj.speed * dt;
        
        // Normalisasi vector & kali speed
        proj.row += (dRow / dist) * moveStep;
        proj.col += (dCol / dist) * moveStep;
    }

    // 3. Hit Detection
    // Jika jarak sangat dekat (misal < 0.5 tile), anggap kena
    if (dist < 0.5) {
        // DEAL DAMAGE
        target.hp -= proj.damage;
        console.log(`Projectile hit ${target.id}! HP left: ${target.hp}`);
        
        // Hapus projectile setelah kena
        projectiles.splice(i, 1);
    }
  }
}