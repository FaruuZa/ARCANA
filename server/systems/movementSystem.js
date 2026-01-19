import { GRID, LANE_COLUMNS, BRIDGE_COLUMNS, RIVER_ROW_START, RIVER_ROW_END } from "../../shared/constants.js";
import { distance } from "../utils/math.js";

// KONFIGURASI FISIKA
const UNIT_RADIUS = 0.4; // Anggap unit lebar 0.8 grid
const BUILDING_RADIUS = 1.2; // Anggap tower lebar
const SEPARATION_FORCE = 2.0; // Kekuatan tolak-menolak antar unit
const KITING_DISTANCE = 3.0; // Jarak aman untuk Archer mundur

export function updateMovement(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;

  for (const unit of units) {
    if (unit.hp <= 0) continue;

    // Vektor Gerakan Akhir (dx, dy)
    let moveX = 0;
    let moveY = 0;
    
    // --- 1. SEPARATION (JANGAN TUMPUK-TUMPUKAN) ---
    // Cek semua unit lain, jika terlalu dekat, menjauh.
    // (Optimasi: Harusnya pakai Quadtree, tapi untuk <50 unit loop biasa masih oke)
    let separationX = 0;
    let separationY = 0;
    let neighbors = 0;

    for (const other of units) {
        if (unit === other) continue; // Jangan cek diri sendiri
        
        const dist = distance(unit, other);
        // Jika jarak < (radius saya + radius dia), berarti tabrakan/overlap
        if (dist < UNIT_RADIUS * 2) {
            // Hitung vektor menjauh (Saya - Dia)
            let pushX = unit.col - other.col;
            let pushY = unit.row - other.row;
            
            // Normalisasi dan beri bobot
            const len = Math.sqrt(pushX*pushX + pushY*pushY);
            if (len > 0) {
                pushX /= len;
                pushY /= len;
                separationX += pushX;
                separationY += pushY;
                neighbors++;
            }
        }
    }

    if (neighbors > 0) {
        moveX += (separationX / neighbors) * SEPARATION_FORCE;
        moveY += (separationY / neighbors) * SEPARATION_FORCE;
    }

    // --- 2. BUILDING COLLISION (JANGAN TEMBUS TOWER) ---
    for (const b of buildings) {
        if (b.hp <= 0) continue;
        
        // Simple Circle Collision untuk Tower
        const dx = unit.col - b.col;
        const dy = unit.row - b.row;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const minDist = UNIT_RADIUS + BUILDING_RADIUS;

        if (dist < minDist) {
            // Dorong unit keluar dari gedung dengan keras
            const pushFactor = (minDist - dist) / dist; // Semakin dalam semakin kuat dorongnya
            moveX += dx * pushFactor * 5.0; 
            moveY += dy * pushFactor * 5.0;
        }
    }

    // --- 3. TARGETING & KITING LOGIC ---
    // Apakah punya target musuh?
    let hasTarget = false;
    let targetEntity = null;

    if (unit.targetId) {
        // Cari object target di units atau buildings
        targetEntity = units.find(u => u.id === unit.targetId) || 
                       buildings.find(b => b.id === unit.targetId);
        
        if (targetEntity && targetEntity.hp > 0) {
            hasTarget = true;
        }
    }

    // LOGIKA PERGERAKAN UTAMA
    if (hasTarget) {
        const distToTarget = distance(unit, targetEntity);
        
        // A. KITING (MUNDUR CANTIK)
        // Syarat: Saya Ranged (range > 2), Musuh Dekat, dan Saya tidak di bibir sungai (biar gak nyemplung)
        const isRanged = unit.range > 2.0;
        const isUnsafe = distToTarget < unit.range * 0.6; // Jika musuh sudah masuk 60% range kita
        
        if (isRanged && isUnsafe) {
            // STRATEGI MUNDUR: Gerak menjauh dari target
            const kiteX = unit.col - targetEntity.col;
            const kiteY = unit.row - targetEntity.row;
            const len = Math.sqrt(kiteX*kiteX + kiteY*kiteY);
            
            // Tambahkan vektor mundur ke gerakan
            if (len > 0) {
                // Kecepatan mundur sedikit lebih lambat dari maju (penalty)
                moveX += (kiteX / len) * unit.speed * 0.8;
                moveY += (kiteY / len) * unit.speed * 0.8;
            }
        } 
        // B. CHASING / ATTACKING
        else if (distToTarget > unit.range) {
            // Jika di luar range, kejar target
            const chaseX = targetEntity.col - unit.col;
            const chaseY = targetEntity.row - unit.row;
            const len = Math.sqrt(chaseX*chaseX + chaseY*chaseY);
            
            if (len > 0) {
                moveX += (chaseX / len) * unit.speed;
                moveY += (chaseY / len) * unit.speed;
            }
        } 
        // C. IN RANGE
        else {
            // Diam di tempat untuk menembak (hanya kena gaya separation)
            // Tidak perlu nambah moveX/Y
        }

    } else {
        // --- 4. DEFAULT PATHFINDING (Jalan ke Depan/Jembatan) ---
        // (Logika Pathfinding Lama dimasukkan ke sini sebagai gaya dorong konstan)
        
        const forwardDir = unit.team === 0 ? 1 : -1;
        
        // Cek Sungai
        const hasCrossedRiver = unit.team === 0 
            ? unit.row > (RIVER_ROW_START + 2) 
            : unit.row < (RIVER_ROW_START - 2);

        let targetRow, targetCol;

        if (!hasCrossedRiver) {
            // Menuju Jembatan
            targetRow = unit.row + (forwardDir * 5);
            
            // Logic Pilih Jembatan (Sama seperti sebelumnya)
            if (unit.lane === 1) { 
                const distLeft = Math.abs(unit.col - BRIDGE_COLUMNS[0]);
                const distRight = Math.abs(unit.col - BRIDGE_COLUMNS[1]);
                const bridgeCol = distLeft <= distRight ? BRIDGE_COLUMNS[0] : BRIDGE_COLUMNS[1];
                
                // Logic Tembok Sungai (Slide)
                const distToRiver = unit.team === 0 ? (RIVER_ROW_START - unit.row) : (unit.row - RIVER_ROW_END);
                const isAtRiverBank = distToRiver < 1.5 && distToRiver > -0.5;
                const isAligned = Math.abs(unit.col - bridgeCol) < 1.0;

                if (isAtRiverBank && !isAligned) {
                    targetRow = unit.row; // Kunci Y
                    targetCol = bridgeCol; // Geser X
                } else {
                    targetCol = bridgeCol;
                }
            } else {
                targetCol = LANE_COLUMNS[unit.lane];
            }
        } else {
            // Menuju Tower Musuh (Sederhana: Maju terus atau ke King)
            targetRow = unit.team === 0 ? GRID.rows : 0;
            targetCol = 9; // Ke tengah (King)
        }

        // Apply Pathfinding Force
        const pathX = targetCol - unit.col;
        const pathY = targetRow - unit.row;
        const pathLen = Math.sqrt(pathX*pathX + pathY*pathY);

        if (pathLen > 0) {
            moveX += (pathX / pathLen) * unit.speed;
            moveY += (pathY / pathLen) * unit.speed;
        }
    }

    // --- 5. APLIKASIKAN GERAKAN DENGAN BATASAN ---
    // Normalisasi total gerakan agar tidak melebihi speed maksimum (kecuali didorong tabrakan)
    // Sebenarnya fisik asli membolehkan speed > max saat didorong, tapi kita clamp biar stabil.
    
    // Terapkan ke posisi
    unit.col += moveX * dt;
    unit.row += moveY * dt;

    // Clamp Boundaries (Biar gak keluar map)
    unit.col = Math.max(0.5, Math.min(18.5, unit.col));
    unit.row = Math.max(0, Math.min(33, unit.row));
  }
}