import {
  GRID,
  LANE_COLUMNS,
  BRIDGE_COLUMNS,
  RIVER_ROW_START,
  RIVER_ROW_END,
} from "../../shared/constants.js";
import { distance } from "../utils/math.js";

const UNIT_RADIUS = 0.4;
const BUILDING_RADIUS = 1.0;
const SEPARATION_FORCE = 2.0;

export function updateMovement(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings]; 

  for (const unit of units) {
    if (unit.hp <= 0) continue;

    let moveX = 0;
    let moveY = 0;

    // --- 1. SEPARATION (Anti-Tumpuk) ---
    let separationX = 0,
      separationY = 0,
      neighbors = 0;
    for (const other of units) {
      if (unit === other) continue;
      const dist = distance(unit, other);
      if (dist < UNIT_RADIUS * 2) {
        let pushX = unit.col - other.col;
        let pushY = unit.row - other.row;
        const len = Math.sqrt(pushX * pushX + pushY * pushY);
        if (len > 0) {
          separationX += pushX / len;
          separationY += pushY / len;
          neighbors++;
        }
      }
    }
    if (neighbors > 0) {
      moveX += (separationX / neighbors) * SEPARATION_FORCE;
      moveY += (separationY / neighbors) * SEPARATION_FORCE;
    }

    // --- 2. BUILDING COLLISION ---
    if (unit.movementType !== 'flying') {
    for (const b of buildings) {
      if (b.hp <= 0) continue;
      const dx = unit.col - b.col;
      const dy = unit.row - b.row;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = UNIT_RADIUS + BUILDING_RADIUS;
      if (dist < minDist) {
        const pushFactor = (minDist - dist) / dist;
        moveX += dx * pushFactor * 5.0;
        moveY += dy * pushFactor * 5.0;
      }
    }
  }

    // --- 3. MOVEMENT LOGIC (HANYA JIKA MOVING) ---
    if (unit.state === "moving") {
      
      // A. KEJAR TARGET SPESIFIK
      if (unit.targetId) {
        const target = allEntities.find((e) => e.id === unit.targetId);
        if (target && target.hp > 0) {
          
          let destRow = target.row;
          let destCol = target.col;

          // LOGIC KHUSUS UNIT DARAT
          if (unit.movementType === 'ground') {
             
             // KASUS 1: TARGET TERBANG (Flying)
             if (target.movementType === 'flying') {
                 // Jangan cari jembatan! Kejar lurus saja.
                 // Tapi CLAMP posisi agar tidak nyemplung sungai.
                 
                 const mySide = unit.row < RIVER_ROW_START ? 'top' : 'bottom';
                 
                 // Jika saya di ATAS, mentok di bibir sungai atas
                 if (mySide === 'top' && destRow > RIVER_ROW_START) {
                     destRow = RIVER_ROW_START - 0.5; // Berhenti di pinggir
                 }
                 // Jika saya di BAWAH, mentok di bibir sungai bawah
                 else if (mySide === 'bottom' && destRow < RIVER_ROW_END) {
                     destRow = RIVER_ROW_END + 0.5; // Berhenti di pinggir
                 }
                 
                 // Kolom ikuti target (agar sejajar untuk menembak)
                 destCol = target.col;

             } 
             // KASUS 2: TARGET DARAT (Perlu Jembatan)
             else {
                 const unitSide = unit.row < RIVER_ROW_START ? 'top' : 'bottom';
                 const targetSide = target.row < RIVER_ROW_START ? 'top' : 'bottom';
                 const isTargetAcross = unitSide !== targetSide;
                 const isTargetOnBridge = (target.row >= RIVER_ROW_START && target.row <= RIVER_ROW_END);

                 if (isTargetAcross && !isTargetOnBridge) {
                     // Cari Jembatan Terdekat
                     const distLeft = Math.abs(unit.col - BRIDGE_COLUMNS[0]);
                     const distRight = Math.abs(unit.col - BRIDGE_COLUMNS[1]);
                     const bridgeCol = distLeft <= distRight ? BRIDGE_COLUMNS[0] : BRIDGE_COLUMNS[1];
                     destCol = bridgeCol;
                     destRow = (RIVER_ROW_START + RIVER_ROW_END) / 2; 

                     // Slide di bibir sungai
                     const distToRiver = unit.team === 0 ? (RIVER_ROW_START - unit.row) : (unit.row - RIVER_ROW_END);
                     const isAtRiverBank = distToRiver < 1.5 && distToRiver > -0.5;
                     const isAligned = Math.abs(unit.col - bridgeCol) < 1.0;
                     if (isAtRiverBank && !isAligned) destRow = unit.row;
                 }
             }
          }

          // Hitung Vektor
          const chaseX = destCol - unit.col;
          const chaseY = destRow - unit.row;
          const len = Math.sqrt(chaseX * chaseX + chaseY * chaseY);

          if (len > unit.range) { 
            moveX += (chaseX / len) * unit.speed;
            moveY += (chaseY / len) * unit.speed;
          }
        } else {
          unit.targetId = null;
        }
      }

      // B. DEFAULT PATHFINDING (Jika tidak ada target di sight)
      if (!unit.targetId) {
        
        let finalDestRow = null;
        let finalDestCol = null;
        let stopDistance = 0; // Jarak berhenti dari tujuan

        // === 1. TENTUKAN TUJUAN AKHIR ===
        
        if (unit.targetTeam === "ally") {
          // --- LOGIC ALLY: FOLLOW / GUARD / RETREAT ---
          
          let leader = null;
          let minLeaderDist = Infinity;

          // Cari Teman untuk diikuti
          for (const other of units) {
              if (other.id === unit.id) continue;
              if (other.team !== unit.team) continue;
              if (other.targetTeam === 'ally') continue; // Jangan ikuti sesama Healer

              const d = distance(unit, other);
              if (d < minLeaderDist) {
                  minLeaderDist = d;
                  leader = other;
              }
          }

          if (leader) {
              // Priority 1: Follow Leader
              finalDestRow = leader.row;
              finalDestCol = leader.col;
              stopDistance = 2.0; // Jaga jarak 2 grid di belakang
          } else {
              // Priority 2: Retreat ke Tower Sendiri
              let bestTower = null;
              let minTowerDist = Infinity;
              for (const b of buildings) {
                if (b.team !== unit.team) continue; // Tower KITA
                if (b.hp <= 0) continue;
                const d = distance(unit, b);
                if (d < minTowerDist) { minTowerDist = d; bestTower = b; }
              }
              if (bestTower) {
                finalDestRow = bestTower.row;
                finalDestCol = bestTower.col;
                stopDistance = 2.5; // Jangan nempel banget sama tower
              }
          }

        } else {
          // --- LOGIC ENEMY: SERANG MARKAS MUSUH ---
          // Cari Tower Musuh Terdekat (atau King)
          let bestTower = null;
          let minTowerDist = Infinity;
          for (const b of buildings) {
             if (b.team === unit.team) continue; // Tower MUSUH
             if (b.hp <= 0) continue; 
             const d = distance(unit, b);
             if (d < minTowerDist) { minTowerDist = d; bestTower = b; }
          }

          if (bestTower) {
             finalDestRow = bestTower.row;
             finalDestCol = bestTower.col;
          } else {
             finalDestRow = unit.team === 0 ? GRID.rows : 0;
             finalDestCol = 9;
          }
          stopDistance = 0; // Tabrak saja (collision handle sisanya)
        }

        // === 2. PATHFINDING LOGIC (BRIDGE CHECK) ===
        // Jika sudah punya tujuan, hitung rute (cek sungai)
        
        if (finalDestRow !== null && finalDestCol !== null) {
            
            let targetRow = finalDestRow;
            let targetCol = finalDestCol;

            // Jika Unit Darat & Harus Nyebrang Sungai
            if (unit.movementType === 'ground') {
                const unitSide = unit.row < RIVER_ROW_START ? 'top' : 'bottom';
                const destSide = targetRow < RIVER_ROW_START ? 'top' : 'bottom';
                
                // Cek apakah target ada di dalam area sungai (jembatan)
                const isDestOnBridge = (targetRow >= RIVER_ROW_START && targetRow <= RIVER_ROW_END);
                const isCrossRiver = unitSide !== destSide;

                if (isCrossRiver && !isDestOnBridge) {
                    // ARAHKAN KE JEMBATAN DULU
                    const distLeft = Math.abs(unit.col - BRIDGE_COLUMNS[0]);
                    const distRight = Math.abs(unit.col - BRIDGE_COLUMNS[1]);
                    const bridgeCol = distLeft <= distRight ? BRIDGE_COLUMNS[0] : BRIDGE_COLUMNS[1];

                    targetCol = bridgeCol;
                    targetRow = (RIVER_ROW_START + RIVER_ROW_END) / 2; // Tengah Jembatan
                    
                    // Reset stop distance karena kita harus lewat jembatan dulu
                    stopDistance = 0; 

                    // Logic Slide di Bibir Sungai (biar mulus masuk jembatan)
                    const distToRiver = unit.team === 0 ? (RIVER_ROW_START - unit.row) : (unit.row - RIVER_ROW_END);
                    const isAtRiverBank = distToRiver < 1.5 && distToRiver > -0.5;
                    const isAligned = Math.abs(unit.col - bridgeCol) < 1.0;
                    if (isAtRiverBank && !isAligned) {
                        targetRow = unit.row; 
                    }
                }
            }

            // === 3. EKSEKUSI GERAKAN ===
            const px = targetCol - unit.col;
            const py = targetRow - unit.row;
            const pl = Math.sqrt(px * px + py * py);

            // Hanya jalan jika jarak lebih besar dari stopDistance
            if (pl > stopDistance) {
                moveX += (px / pl) * unit.speed;
                moveY += (py / pl) * unit.speed;
            }
        }
      }
    }

    // --- 4. APPLY PHYSICS ---
    unit.col += moveX * dt;
    unit.row += moveY * dt;
    unit.col = Math.max(0.5, Math.min(GRID.cols - 0.5, unit.col));
    unit.row = Math.max(0, Math.min(GRID.rows, unit.row));
  }
}