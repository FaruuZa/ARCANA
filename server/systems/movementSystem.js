import { GRID, LANE_COLUMNS, BRIDGE_COLUMNS, RIVER_ROW_START, RIVER_ROW_END } from "../../shared/constants.js";
import { distance } from "../utils/math.js";

const UNIT_RADIUS = 0.4; 
const BUILDING_RADIUS = 1.0; 
const SEPARATION_FORCE = 2.0; 

export function updateMovement(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings]; // Penting untuk lookup

  for (const unit of units) {
    if (unit.hp <= 0) continue;

    let moveX = 0;
    let moveY = 0;

    // --- 1. SEPARATION (Anti-Tumpuk) ---
    let separationX = 0, separationY = 0, neighbors = 0;
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

    // --- 3. MOVEMENT LOGIC (HANYA JIKA MOVING) ---
    if (unit.state === "moving") {
      
      // A. KEJAR TARGET SPESIFIK (Unit/Tower Musuh)
      if (unit.targetId) {
        const target = allEntities.find((e) => e.id === unit.targetId);
        if (target && target.hp > 0) {
          const chaseX = target.col - unit.col;
          const chaseY = target.row - unit.row;
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
        const forwardDir = unit.team === 0 ? 1 : -1;
        const hasCrossedRiver = unit.team === 0
             ? unit.row > (RIVER_ROW_START + 2)
             : unit.row < (RIVER_ROW_START - 2);

        let targetRow, targetCol;

        if (!hasCrossedRiver) {
          // --- FASE 1: MENUJU JEMBATAN ---
          targetRow = unit.row + forwardDir * 5;
          if (unit.lane === 1) { 
             const distLeft = Math.abs(unit.col - BRIDGE_COLUMNS[0]);
             const distRight = Math.abs(unit.col - BRIDGE_COLUMNS[1]);
             const bridgeCol = distLeft <= distRight ? BRIDGE_COLUMNS[0] : BRIDGE_COLUMNS[1];
             targetCol = bridgeCol;
             
             // Logic Slide di Bibir Sungai
             const distToRiver = unit.team === 0 ? (RIVER_ROW_START - unit.row) : (unit.row - RIVER_ROW_END);
             const isAtRiverBank = distToRiver < 1.5 && distToRiver > -0.5;
             const isAligned = Math.abs(unit.col - bridgeCol) < 1.0;
             if (isAtRiverBank && !isAligned) targetRow = unit.row; 
          } else { 
             targetCol = LANE_COLUMNS[unit.lane];
          }
        } else {
          // --- FASE 2: CARI TOWER TERDEKAT (BUKAN LANGSUNG KING) ---
          let bestTower = null;
          let minTowerDist = Infinity;

          for (const b of buildings) {
              if (b.team === unit.team) continue; // Jangan ke tower teman
              if (b.hp <= 0) continue; // Jangan ke puing

              // Cari tower yang jaraknya paling dekat dengan unit saat ini
              const d = distance(unit, b);
              if (d < minTowerDist) {
                  minTowerDist = d;
                  bestTower = b;
              }
          }

          if (bestTower) {
              // Menuju tower terdekat (Side atau King, mana yg dekat)
              targetRow = bestTower.row;
              targetCol = bestTower.col;
          } else {
              // Jika semua tower hancur (atau bug), baru lurus ke ujung
              targetRow = unit.team === 0 ? GRID.rows : 0;
              targetCol = 9; 
          }
        }

        const pathX = targetCol - unit.col;
        const pathY = targetRow - unit.row;
        const pathLen = Math.sqrt(pathX * pathX + pathY * pathY);
        if (pathLen > 0) {
          moveX += (pathX / pathLen) * unit.speed;
          moveY += (pathY / pathLen) * unit.speed;
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