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
const RIVER_TOP_BANK = RIVER_ROW_START - 0.5;
const RIVER_BOT_BANK = RIVER_ROW_END + 0.5;

export function updateMovement(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings];

  for (const unit of units) {
    if (unit.hp <= 0) continue;

    // --- PHYSICS ALWAYS RUN (Separation & Collision) ---
    let moveX = 0;
    let moveY = 0;

    // ... SEPARATION CODE ...
    const currentSeparation = unit.isCrossing
      ? SEPARATION_FORCE * 0.2
      : SEPARATION_FORCE;
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
      moveX += (separationX / neighbors) * currentSeparation;
      moveY += (separationY / neighbors) * currentSeparation;
    }

    // ... BUILDING COLLISION CODE ...
    if (unit.movementType !== "flying") {
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

    // --- MOVEMENT LOGIC (NAVIGATION) ---
    // Hanya jalan jika STATE === 'moving'
    // State ini di-set oleh AttackSystem atau default spawn

    if (unit.state === "moving") {
      let finalDest = null;
      let stopDistance = 0;

      // A. CEK INTENT UNTUK TUJUAN
      if (unit.intent.type === "engage" && unit.intent.targetId) {
        // Priority 1: Kejar Target
        const target = allEntities.find((e) => e.id === unit.intent.targetId);
        if (target) {
          finalDest = { col: target.col, row: target.row };
          // Stop distance 0, karena AttackSystem yang akan stop kita saat masuk range
        }
      }

      // Priority 2: Default Path (Idle / Lane Push)
      if (!finalDest) {
        // (Logic Default Pathfinding Leader/Tower SAMA seperti sebelumnya)
        //
        if (unit.targetTeam === "ally") {
          // Healer Default: Follow Leader / Retreat
          let leader = null;
          let minD = Infinity;
          for (const other of units) {
            if (
              other.id === unit.id ||
              other.team !== unit.team ||
              other.targetTeam === "ally"
            )
              continue;
            const d = distance(unit, other);
            if (d < minD) {
              minD = d;
              leader = other;
            }
          }
          if (leader) {
            finalDest = { col: leader.col, row: leader.row };
            stopDistance = 2.0;
          } else {
            let bestB = null;
            let minBD = Infinity;
            for (const b of buildings) {
              if (b.team !== unit.team || b.hp <= 0) continue;
              const d = distance(unit, b);
              if (d < minBD) {
                minBD = d;
                bestB = b;
              }
            }
            if (bestB) {
              finalDest = { col: bestB.col, row: bestB.row };
              stopDistance = 2.5;
            }
          }
        } else {
          // Attacker Default: Cari Tower Musuh
          let bestB = null;
          let minBD = Infinity;
          for (const b of buildings) {
            if (b.team === unit.team || b.hp <= 0) continue;
            const d = distance(unit, b);
            if (d < minBD) {
              minBD = d;
              bestB = b;
            }
          }
          if (bestB) {
            finalDest = { col: bestB.col, row: bestB.row };
          } else {
            finalDest = { col: 9, row: unit.team === 0 ? GRID.rows : 0 };
          }
        }
      }

      // B. EXECUTE MOVE
      if (finalDest) {
        const waypoint = getSmartWaypoint(unit, finalDest);
        const px = waypoint.col - unit.col;
        const py = waypoint.row - unit.row;
        const pl = Math.sqrt(px * px + py * py);

        const isFinalLeg =
          waypoint.col === finalDest.col && waypoint.row === finalDest.row;
        const actualLimit = isFinalLeg ? stopDistance : 0.1;

        if (pl > actualLimit) {
          moveX += (px / pl) * unit.speed;
          moveY += (py / pl) * unit.speed;
        }
      }
    }

    // --- APPLY & PHYSICS (River Wall) ---
    // (Logic River Wall SAMA PERSIS seperti sebelumnya)
    let nextCol = unit.col + moveX * dt;
    let nextRow = unit.row + moveY * dt;

    if (unit.movementType === "ground") {
      const inRiverZone = nextRow > RIVER_TOP_BANK && nextRow < RIVER_BOT_BANK;
      if (inRiverZone) {
        const BRIDGE_WIDTH = 1.5;

        const onBridgeLeft =
          Math.abs(nextCol - BRIDGE_COLUMNS[0]) < BRIDGE_WIDTH;
        const onBridgeRight =
          Math.abs(nextCol - BRIDGE_COLUMNS[1]) < BRIDGE_WIDTH;

        if (!onBridgeLeft && !onBridgeRight && !unit.isCrossing) {
          const distToTop = Math.abs(nextRow - RIVER_TOP_BANK);
          const distToBot = Math.abs(nextRow - RIVER_BOT_BANK);
          if (distToTop < distToBot) nextRow = RIVER_TOP_BANK - 0.01;
          else nextRow = RIVER_BOT_BANK + 0.01;

          // Conserve Velocity
          if (Math.abs(moveX) > 0.01) moveX = Math.sign(moveX) * unit.speed;
          moveY = 0;
        } else unit.isCrossing = true;
      } else {
        if(
            unit.row < RIVER_TOP_BANK - 0.5 ||
            unit.row > RIVER_BOT_BANK + 0.5
          ){
          unit.isCrossing = false;
        }
        
      }
    }

    unit.col = Math.max(0.5, Math.min(GRID.cols - 0.5, nextCol));
    unit.row = Math.max(0, Math.min(GRID.rows, nextRow));
  }
}

// Helper sama persis
function getSmartWaypoint(unit, finalDest) {
  if (unit.movementType !== "ground") return finalDest;
  const unitY = unit.row;
  const destY = finalDest.row;
  const unitSide =
    unitY < RIVER_TOP_BANK
      ? "top"
      : unitY > RIVER_BOT_BANK
        ? "bottom"
        : "river";
  const destSide =
    destY < RIVER_TOP_BANK
      ? "top"
      : destY > RIVER_BOT_BANK
        ? "bottom"
        : "river";
  if (unitSide === destSide || unitSide === "river" || destSide === "river")
    return finalDest;

  const distLeft = Math.abs(unit.col - BRIDGE_COLUMNS[0]);
  const distRight = Math.abs(unit.col - BRIDGE_COLUMNS[1]);
  const bridgeCol =
    distLeft <= distRight ? BRIDGE_COLUMNS[0] : BRIDGE_COLUMNS[1];

  const distToBridgeX = Math.abs(unit.col - bridgeCol);
  const distToRiverEdge = Math.min(
    Math.abs(unit.row - RIVER_TOP_BANK),
    Math.abs(unit.row - RIVER_BOT_BANK),
  );

  if (distToBridgeX > 3.0 && distToRiverEdge < 1.5) {
    const safetyRow =
      unitSide === "top" ? RIVER_TOP_BANK - 2.0 : RIVER_BOT_BANK + 2.0;
    return { col: bridgeCol, row: safetyRow };
  }
  let bridgeDestRow;
  if (destSide === "top") bridgeDestRow = RIVER_TOP_BANK - 2.0;
  else bridgeDestRow = RIVER_BOT_BANK + 2.0;

  return { col: bridgeCol, row: bridgeDestRow };
}
