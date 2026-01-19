import { distance } from "../utils/math.js";

export function updateTargeting(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  // [FIX] Gabungkan untuk pencarian target
  const allEntities = [...units, ...buildings];

  for (const unit of units) {
    // 0. Kurangi Timer Deploy (jika ada)
    if (unit.stateTimer > 0) {
        unit.stateTimer -= dt;
    }

    // === KASUS 1: SEDANG ATTACKING (Fokus Nembak) ===
    if (unit.state === 'attacking') {
        const target = allEntities.find(e => e.id === unit.targetId);
        
        // Target mati/hilang? -> Jalan lagi
        if (!target || target.hp <= 0) {
            unit.targetId = null;
            unit.state = 'moving';
            continue;
        }

        // Musuh kabur dari range? -> Kejar lagi
        if (distance(unit, target) > unit.range + 0.5) {
            unit.state = 'moving'; 
        }
        
        continue; 
    }

    // === KASUS 2: SEDANG PRE-ATTACK (Persiapan) ===
    if (unit.state === 'pre_attack') {
        if (unit.stateTimer <= 0) {
            // Waktu persiapan selesai -> Mulai Nembak
            unit.state = 'attacking';
        }
        continue;
    }

    // === KASUS 3: SEDANG MOVING (Cari Musuh) ===
    if (unit.state === 'moving') {
        
        // A. Cek Target yang sedang dikejar (jika ada)
        if (unit.targetId) {
            const target = allEntities.find(e => e.id === unit.targetId);
            if (target && target.hp > 0) {
                // Apakah sudah sampai jarak tembak?
                if (distance(unit, target) <= unit.range) {
                    startAttackStance(unit);
                }
                continue; 
            } else {
                unit.targetId = null; // Target mati, cari yang baru
            }
        }

        // B. Scan Musuh Baru (Sight Range)
        let closestTarget = null;
        let minDist = unit.sightRange; 

        for (const other of allEntities) {
            if (other.team === unit.team) continue; // Teman sendiri
            if (other.hp <= 0) continue; // Sudah mati

            const d = distance(unit, other);
            
            if (d <= minDist) {
                minDist = d;
                closestTarget = other;
            }
        }

        if (closestTarget) {
            unit.targetId = closestTarget.id;
            
            // Jika kebetulan langsung dekat, langsung stance
            if (minDist <= unit.range) {
                startAttackStance(unit);
            }
        }
    }
  }
}

function startAttackStance(unit) {
    unit.state = 'pre_attack';
    // Gunakan deployTime dari kartu (default 0.5 detik)
    unit.stateTimer = unit.deployTime || 0.5; 
}