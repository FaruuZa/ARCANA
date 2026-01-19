import { distance } from "../utils/math.js";

export function updateTargeting(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings];

  for (const unit of units) {
    // 1. Jika masih Spawning, jangan mikir dulu
    if (unit.state === 'spawning') {
        unit.intent = { type: 'idle', targetId: null };
        continue;
    }

    // 2. Evaluasi Target Lama (Soft Targeting)
    // Apakah niat kita saat ini masih valid?
    if (unit.intent.targetId) {
        const target = allEntities.find(e => e.id === unit.intent.targetId);
        
        let dropTarget = false;

        // A. Target Mati/Hilang
        if (!target || target.hp <= 0) dropTarget = true;

        // B. Target Keluar Sight Range (Biar gak ngejar sampe ujung dunia)
        else if (distance(unit, target) > unit.sightRange + 1.0) dropTarget = true;

        // C. Khusus Healer: Target sudah sehat
        else if (unit.targetTeam === 'ally' && target.hp >= target.maxHp) dropTarget = true;

        if (dropTarget) {
            // Reset Intent ke Default
            unit.intent = { type: 'idle', targetId: null };
        } else {
            // Target masih valid, pertahankan Intent 'engage'
            // (Kecuali kita mau tambah logic switch target prioritas disini)
            continue; 
        }
    }

    // 3. Scan Target Baru (Jika Idle)
    if (unit.intent.type === 'idle') {
        const bestTarget = scanForTarget(unit, allEntities);
        if (bestTarget) {
            // Ubah Niat: ENGAGE!
            unit.intent = { type: 'engage', targetId: bestTarget.id };
        }
    }
  }
}

// Helper Scan (Logic Priority sama seperti sebelumnya)
function scanForTarget(unit, allEntities) {
    if (unit.targetTeam === 'ally') {
        // --- Logic Healer ---
        let bestTarget = null;
        let lowestHpPct = 1.0; 
        let closestDist = unit.sightRange;

        for (const other of allEntities) {
            if (other.hp <= 0 || other.id === unit.id) continue;
            if (!isValidTarget(unit, other)) continue; 

            const d = distance(unit, other);
            if (d > unit.sightRange) continue;

            const hpPct = other.hp / other.maxHp;
            if (hpPct < lowestHpPct - 0.1) {
                lowestHpPct = hpPct; closestDist = d; bestTarget = other;
            } else if (hpPct < lowestHpPct + 0.1) {
                if (d < closestDist) { lowestHpPct = hpPct; closestDist = d; bestTarget = other; }
            }
        }
        return bestTarget;

    } else {
        // --- Logic Attacker ---
        let closestTarget = null;
        let minDist = unit.sightRange; 
        for (const other of allEntities) {
            if (other.hp <= 0 || other.id === unit.id) continue;
            if (!isValidTarget(unit, other)) continue;
            
            const d = distance(unit, other);
            if (d <= minDist) { minDist = d; closestTarget = other; }
        }
        return closestTarget;
    }
}

function isValidTarget(attacker, candidate) {
    // Logic validasi sama persis (Team, Rule, Height)
    if (attacker.targetTeam === 'ally') {
        if (candidate.team !== attacker.team) return false;
        if (candidate.hp >= candidate.maxHp) return false;
    } else {
        if (candidate.team === attacker.team) return false;
    }
    const candType = candidate.entityType || 'building'; 
    if (attacker.targetRule === 'building_only' && candType !== 'building') return false;
    if (attacker.targetRule === 'unit_only' && candType !== 'unit') return false;
    
    const candMoveType = candidate.movementType || 'ground';
    if (attacker.targetHeight === 'ground' && candMoveType !== 'ground') return false;
    if (attacker.targetHeight === 'air' && candMoveType !== 'flying') return false;
    
    return true;
}