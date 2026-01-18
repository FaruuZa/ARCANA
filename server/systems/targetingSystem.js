import { distance } from "../utils/math.js";

export function updateTargeting(gameState) {
  const units = gameState.units;
  const buildings = gameState.buildings;

  // 1. Definisikan siapa saja yang bisa menjadi TARGET (Musuh)
  const allPotentialTargets = [...units, ...buildings];
  
  // 2. Definisikan siapa saja yang bisa MENYERANG (Attacker)
  // SEKARANG: Kita gabung units DAN buildings agar Tower juga mencari target
  const allAttackers = [...units, ...buildings];

  for (const attacker of allAttackers) {
    // Lewati jika attacker sudah hancur/mati
    if (attacker.hp <= 0) continue;

    // --- LOGIC VALIDASI TARGET LAMA (Sticky) ---
    if (attacker.targetId !== null) {
      const currentTarget = allPotentialTargets.find(e => e.id === attacker.targetId);
      
      // Target valid jika: Ada, Hidup, dan Masih dalam Range
      if (currentTarget && currentTarget.hp > 0) {
        const dist = distance(attacker, currentTarget);
        
        // Toleransi sedikit (0.5 grid) agar target tidak lepas-pasang (flicker) di ujung range
        if (dist <= attacker.range + 0.5) { 
           continue; // Masih valid, skip cari baru
        }
      }
      
      // Target tidak valid / kabur -> Reset
      attacker.targetId = null;
    }

    // --- LOGIC MENCARI TARGET BARU ---
    let closestTarget = null;
    let closestDist = Infinity;

    for (const potentialTarget of allPotentialTargets) {
      if (potentialTarget.id === attacker.id) continue; // Jangan target diri sendiri
      if (potentialTarget.team === attacker.team) continue; // Jangan target teman
      if (potentialTarget.hp <= 0) continue; // Jangan target mayat

      const dist = distance(attacker, potentialTarget);

      // Cek apakah masuk Range si Attacker
      if (dist <= attacker.range) {
        if (dist < closestDist) {
          closestDist = dist;
          closestTarget = potentialTarget;
        }
      }
    }

    // Set Target jika ketemu
    if (closestTarget) {
      attacker.targetId = closestTarget.id;
    }
  }
}