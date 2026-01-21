import {
  GRID,
  LANE_COLUMNS,
  BRIDGE_COLUMNS,
  RIVER_ROW_START,
  RIVER_ROW_END,
} from "../../shared/constants.js";
import { distance } from "../utils/math.js";
import { dealAreaDamage } from "../utils/combat.js";

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

    // --- 1. JUMP LOGIC (Assassin) ---
    if (unit.isJumping && unit.jumpTargetPos) {
      const dx = unit.jumpTargetPos.col - unit.col;
      const dy = unit.jumpTargetPos.row - unit.row;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (isNaN(dist)) {
        unit.isJumping = false;
        unit.jumpTargetPos = null;
        unit.state = "moving";
        continue;
      }

      const jumpSpeed = unit.traits.jump.speed || 15.0;
      const step = jumpSpeed * dt;

      if (dist <= step || dist < 0.1) {
        // MENDARAT
        unit.col = unit.jumpTargetPos.col;
        unit.row = unit.jumpTargetPos.row;
        unit.isJumping = false;
        unit.jumpTargetPos = null;
        unit.state = "attacking";

        // Efek Mendarat
        if (unit.traits.jump.damage) {
          const jumpTargetRule = unit.traits.jump.targetRule || "enemy";
          dealAreaDamage(
            gameState,
            unit,
            unit.traits.jump.aoeRadius || 1.0,
            unit.traits.jump.damage,
            unit.team,
            "both",
            jumpTargetRule,
          );

          gameState.effects.push({
            id: gameState.nextEntityId++,
            type: "shockwave",
            col: unit.col,
            row: unit.row,
            radius: unit.traits.jump.aoeRadius || 1.0,
            duration: 0.2,
            time: 0.2,
          });
        }
      } else {
        // TERBANG
        unit.col += (dx / dist) * step;
        unit.row += (dy / dist) * step;
      }
      continue; // Skip logic lain
    }

    // --- 2. JUMP WINDUP (Channeling) ---
    if (unit.isChannelingJump) {
      unit.jumpWindupTimer -= dt;
      if (unit.jumpWindupTimer <= 0) {
        unit.isChannelingJump = false;
        unit.isJumping = true;
      } else {
        continue;
      }
    }
    if (unit.traits.jump && unit.jumpCooldown > 0) {
      unit.jumpCooldown -= dt;
    }

    // --- 3. PHYSICS (Separation & Collision) ---
    let moveX = 0;
    let moveY = 0;

    // SEPARATION (Unit vs Unit) - [UPDATED SAFETY]
    const currentSeparation = unit.isCrossing
      ? SEPARATION_FORCE * 0.2
      : SEPARATION_FORCE;
    let separationX = 0,
      separationY = 0,
      neighbors = 0;
    for (const other of units) {
      if (unit === other) continue;

      let px = unit.col - other.col;
      let py = unit.row - other.row;
      let dist = Math.sqrt(px * px + py * py);

      if (dist < 0.0001) {
        px = 0.1; // Dorong sedikit ke kanan
        dist = 0.1;
      }

      if (dist < unit.radius - 0.3 + other.radius) {
        if (dist > 0) {
          separationX += px / dist;
          separationY += py / dist;
          neighbors++;
        }
      }
    }
    if (neighbors > 0) {
      moveX += (separationX / neighbors) * currentSeparation;
      moveY += (separationY / neighbors) * currentSeparation;
    }

    // BUILDING COLLISION
    if (unit.movementType !== "flying") {
      for (const b of buildings) {
        if (b.hp <= 0) continue;
        const dx = unit.col - b.col;
        const dy = unit.row - b.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.0001) {
          moveY += 5.0; // Dorong ke bawah
          moveX += 1.0; // Dorong sedikit ke kanan biar gak lurus kaku
          continue; // Skip kalkulasi fisika normal frame ini
        }

        const minDist = unit.radius - 0.3 + BUILDING_RADIUS;
        if (dist < minDist) {
          const pushFactor = (minDist - dist) / dist;
          moveX += dx * pushFactor * 5.0;
          moveY += dy * pushFactor * 5.0;
          if (Math.abs(dx) < 0.4) {
            const slideDir = dx >= 0 ? 1.0 : -1.0;
            moveX += slideDir * 4.0;
          }
        }
      }
    }

    // --- 4. NAVIGATION LOGIC ---
    if (unit.state === "moving") {
      // A. TRIGGER JUMP?
      if (unit.traits.jump && unit.jumpCooldown <= 0) {
        // [NEW] PRIORITY TARGET SCANNING
        let potentialTargets = [];
        const jumpRange = unit.traits.jump.range;
        const minRange = unit.traits.jump.minRange || 0;

        // Cari semua target valid dalam range lompat
        for (const ent of allEntities) {
          if (ent.id === unit.id) continue;
          if (ent.hp <= 0) continue;
          if (ent.team === unit.team) continue; // Musuh saja

          const d = distance(unit, ent);
          if (d <= jumpRange && d >= minRange) {
            potentialTargets.push({ entity: ent, dist: d });
          }
        }

        if (potentialTargets.length > 0) {
          // Sort berdasarkan Priority
          const priority = unit.traits.jump.priority || "nearest";

          if (priority === "farthest") {
            // Terjauh dulu (Descending)
            potentialTargets.sort((a, b) => b.dist - a.dist);
          } else {
            // Terdekat dulu (Ascending)
            potentialTargets.sort((a, b) => a.dist - b.dist);
          }

          // Ambil Target Terbaik
          const bestTarget = potentialTargets[0].entity;

          // === [FIX 1] HITUNG LANDING POSITION (TEPI TARGET) ===
          let landCol = bestTarget.col;
          let landRow = bestTarget.row;

          // Jika target adalah Building, jangan mendarat di tengah!
          if (
            bestTarget.entityType === "building" ||
            bestTarget.type === "king" ||
            bestTarget.type === "side"
          ) {
            // Hitung vektor arah dari unit ke tower
            const dx = bestTarget.col - unit.col;
            const dy = bestTarget.row - unit.row;
            const d = Math.sqrt(dx * dx + dy * dy);

            // Kita ingin mendarat di jarak aman (Radius Tower + Radius Unit + Sedikit Buffer)
            // Radius Tower = 1.0 (BUILDING_RADIUS)
            const safeDistance = BUILDING_RADIUS + (unit.radius - 0.3) + 0.2;

            // Kita geser titik pendaratan mundur dari pusat tower ke arah unit
            const landDistance = Math.max(0, d - safeDistance);

            if (d > 0) {
              landCol = unit.col + (dx / d) * landDistance;
              landRow = unit.row + (dy / d) * landDistance;
            }
          }

          // === [FIX 2] START WINDUP ===
          unit.isChannelingJump = true;
          unit.jumpWindupTimer = unit.traits.jump.windup || 0; // Default 0 kalo gak diset
          unit.jumpCooldown = unit.traits.jump.cooldown;

          // Simpan Tujuan (bukan referensi entity, tapi koordinat mati)
          unit.jumpTargetPos = { col: landCol, row: landRow };

          unit.chargeTimer = 0;
          unit.isCharging = false;

          continue; // Skip movement frame ini
        }
      }

      let finalDest = null;
      let stopDistance = 0;

      // B. INTENT: ENGAGE (Kejar Musuh)
      if (unit.intent.type === "engage" && unit.intent.targetId) {
        const target = allEntities.find((e) => e.id === unit.intent.targetId);
        if (target) {
          finalDest = { col: target.col, row: target.row };
        }
      }

      // C. INTENT: IDLE / FOLLOW (Default Path)
      if (!finalDest) {
        if (unit.targetTeam === "ally") {
          // ===============================================
          // [FIX] LOGIC HEALER FOLLOW (ANTI-DORONG)
          // ===============================================
          let leader = null;
          let minD = Infinity;

          // 1. Cari Leader
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
            const isLeaderMoving = leader.state === "moving";

            // Jarak ideal berhenti
            const idealStop = isLeaderMoving ? 2.5 : 3.5;

            // Toleransi Gerak (Hysteresis):
            // Kalau Leader gerak: toleransi kecil (sama dengan stop distance)
            // Kalau Leader diam: toleransi besar (tambah 1.0 tile)
            // Artinya: Jika kita ada di jarak 3.9 dan idealStop 3.5, KITA DIAM SAJA.
            // Kita baru jalan kalau jarak > 4.5.
            const movementThreshold = isLeaderMoving ? 2.5 : idealStop + 1.0;

            const distToLeader = distance(unit, leader);

            if (distToLeader > movementThreshold) {
              // Terlalu jauh -> Jalan mendekat
              finalDest = { col: leader.col, row: leader.row };
              stopDistance = idealStop;
            } else {
              // Sudah "cukup" dekat (dalam range toleransi) -> REM TANGAN!
              finalDest = null;
            }
          } else {
            // Tidak ada Leader -> Cari Tower
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
          // Logic Attacker (Target Musuh/Base) - TETAP SAMA
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

      // EXECUTE MOVE
      if (finalDest) {
        const wp = getSmartWaypoint(unit, finalDest);
        const px = wp.col - unit.col;
        const py = wp.row - unit.row;
        const pl = Math.sqrt(px * px + py * py);

        const isFinalLeg = wp.col === finalDest.col && wp.row === finalDest.row;
        const actualLimit = isFinalLeg ? stopDistance : 0.1;

        if (pl > actualLimit) {
          let currentSpeed = unit.speed;
          if (unit.isCharging && unit.traits.charge) {
            currentSpeed *= unit.traits.charge.speedMult;
          }
          moveX += (px / pl) * currentSpeed;
          moveY += (py / pl) * currentSpeed;
        }
      }
    }

    // --- 5. CHARGE UPDATE & PHYSICS APPLY ---
    const velocity = Math.sqrt(moveX * moveX + moveY * moveY);
    if (unit.traits.charge && velocity > 0.5) {
      unit.chargeTimer += dt;
      if (unit.chargeTimer >= unit.traits.charge.windupTime) {
        if (!unit.isCharging) unit.isCharging = true;
      }
    } else {
      unit.chargeTimer = 0;
      unit.isCharging = false;
    }

    let nextCol = unit.col + moveX * dt;
    let nextRow = unit.row + moveY * dt;

    if (!isNaN(nextCol))
      unit.col = Math.max(0.5, Math.min(GRID.cols - 0.5, nextCol));
    if (!isNaN(nextRow)) unit.row = Math.max(0, Math.min(GRID.rows, nextRow));

    // RIVER WALL LOGIC
    if (unit.movementType === "ground") {
      const inRiverZone = nextRow > RIVER_TOP_BANK && nextRow < RIVER_BOT_BANK;
      if (inRiverZone) {
        const isMounted = unit.traits.mounted === true;
        const BRIDGE_WIDTH = 1.5;
        if (!isMounted) {
          const onBridgeLeft =
            Math.abs(nextCol - BRIDGE_COLUMNS[0]) < BRIDGE_WIDTH;
          const onBridgeRight =
            Math.abs(nextCol - BRIDGE_COLUMNS[1]) < BRIDGE_WIDTH;
          if (!onBridgeLeft && !onBridgeRight && !unit.isCrossing) {
            if (
              Math.abs(unit.row - RIVER_TOP_BANK) <
              Math.abs(unit.row - RIVER_BOT_BANK)
            ) {
              unit.row = RIVER_TOP_BANK - 0.1;
            } else {
              unit.row = RIVER_BOT_BANK + 0.1;
            }
          } else unit.isCrossing = true;
        } else {
          unit.isCrossing = true;
        }
      } else {
        if (
          unit.row < RIVER_TOP_BANK - 0.5 ||
          unit.row > RIVER_BOT_BANK + 0.5
        ) {
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
  if (unit.movementType !== "ground" || unit.traits.mounted) return finalDest;
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
