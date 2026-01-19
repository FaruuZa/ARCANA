import { distance } from "../utils/math.js";
import { RIVER_ROW_START, RIVER_ROW_END } from "../../shared/constants.js";

export function updateTargeting(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings];

  for (const unit of units) {
    if (unit.stateTimer > 0) unit.stateTimer -= dt;
    
    // 1. Spawning
    if (unit.state === 'spawning') { 
        if (unit.stateTimer <= 0) unit.state = 'moving'; 
        continue; 
    }

    // 2. Attacking (Validasi Target Saat Menyerang)
    if (unit.state === 'attacking') {
        const target = allEntities.find(e => e.id === unit.targetId);
        
        let stopAttacking = false;

        // Cek 1: Target hilang/mati
        if (!target || target.hp <= 0) stopAttacking = true;
        
        // Cek 2: (KHUSUS HEALER) Target sudah sehat walafiat
        if (target && unit.targetTeam === 'ally' && target.hp >= target.maxHp) {
            stopAttacking = true;
        }

        if (stopAttacking) {
            unit.targetId = null;
            unit.state = 'moving';
            continue;
        }

        // Cek 3: Target kabur dari range
        if (distance(unit, target) > unit.range + 0.5) {
            unit.state = 'moving'; 
        }
        continue; 
    }

    // 3. Pre-Attack
    if (unit.state === 'pre_attack') { 
        if (unit.stateTimer <= 0) unit.state = 'attacking'; 
        continue;
    }

    // 4. Moving (Cari Target)
    if (unit.state === 'moving') {
        
        // A. Cek Target Lama (Apakah masih valid?)
        if (unit.targetId) {
            const target = allEntities.find(e => e.id === unit.targetId);

            if (shouldDropTarget(unit, target)) {
                unit.targetId = null; 
                // Lanjut ke blok B untuk cari target baru detik ini juga
            } else {
                if (distance(unit, target) <= unit.range) startAttackStance(unit);
                continue; 
            }
        }

        // B. SCAN TARGET BARU (Priority Logic)
        
        // --- LOGIC HEALER (Cari Sekarat) ---
        if (unit.targetTeam === 'ally') {
            let bestTarget = null;
            let lowestHpPct = 1.0; // 100%
            let closestDist = unit.sightRange;

            for (const other of allEntities) {
                if (other.hp <= 0 || other.id === unit.id) continue;
                if (!isValidTarget(unit, other)) continue; // Filter HP Penuh ada di sini juga

                const d = distance(unit, other);
                if (d > unit.sightRange) continue;

                const hpPct = other.hp / other.maxHp;

                // Prioritas: HP Terendah (Sekarat)
                if (hpPct < lowestHpPct - 0.1) {
                    // Bedanya signifikan (>10%), ambil yang sekarat
                    lowestHpPct = hpPct;
                    closestDist = d;
                    bestTarget = other;
                } else if (hpPct < lowestHpPct + 0.1) {
                    // HP mirip, ambil yang terdekat
                    if (d < closestDist) {
                        lowestHpPct = hpPct;
                        closestDist = d;
                        bestTarget = other;
                    }
                }
            }

            if (bestTarget) {
                unit.targetId = bestTarget.id;
                if (distance(unit, bestTarget) <= unit.range) startAttackStance(unit);
            }

        } else {
            // --- LOGIC MUSUH NORMAL (Cari Terdekat) ---
            let closestTarget = null;
            let minDist = unit.sightRange; 
            for (const other of allEntities) {
                if (other.hp <= 0 || other.id === unit.id) continue;
                if (!isValidTarget(unit, other)) continue;
                const d = distance(unit, other);
                if (d <= minDist) { minDist = d; closestTarget = other; }
            }
            if (closestTarget) {
                unit.targetId = closestTarget.id;
                if (minDist <= unit.range) startAttackStance(unit);
            }
        }
    }
  }
}


function shouldDropTarget(attacker, target) {
    // 1. Dasar
    if (!target || target.hp <= 0) return true;

    // 2. Healer: Lepas jika teman sudah sehat
    if (attacker.targetTeam === 'ally' && target.hp >= target.maxHp) return true;

    // 3. [BARU] LOGIC FLYING VS RIVER
    // Jika target TERBANG dan berada DI ATAS SUNGAI
    if (target.movementType === 'flying') {
        const isOverRiver = target.row > (RIVER_ROW_START - 1) && target.row < (RIVER_ROW_END + 1);
        
        if (isOverRiver) {
             // Jika saya CUMA BISA SERANG DARAT (Ground-Only Targeting) -> Nyerah
             if (attacker.targetHeight === 'ground') return true;

             // (Opsional) Jika saya Melee (Range pendek) -> Nyerah juga, percuma nunggu di pinggir
             if (attacker.range < 2.0) return true;
        }
    }

    return false;
}

function startAttackStance(unit) {
    unit.state = 'pre_attack';
    unit.stateTimer = unit.aimTime || 0.5; 
}

function isValidTarget(attacker, candidate) {
    // 1. RULE: TEAM
    if (attacker.targetTeam === 'ally') {
        if (candidate.team !== attacker.team) return false;
        if (candidate.hp >= candidate.maxHp) return false; // Filter Target Penuh
    } else {
        if (candidate.team === attacker.team) return false;
    }
    // 2. RULE: CATEGORY
    const candType = candidate.entityType || 'building'; 
    if (attacker.targetRule === 'building_only' && candType !== 'building') return false;
    if (attacker.targetRule === 'unit_only' && candType !== 'unit') return false;
    
    // 3. RULE: HEIGHT
    const candMoveType = candidate.movementType || 'ground';
    if (attacker.targetHeight === 'ground' && candMoveType !== 'ground') return false;
    if (attacker.targetHeight === 'air' && candMoveType !== 'flying') return false;
    
    return true;
}