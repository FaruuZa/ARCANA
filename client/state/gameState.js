const stateBuffer = [];
const INTERPOLATION_DELAY = 100; //ms


const listeners = new Set();

export let myTeamId = -1;

export const gameState = {
  data: {
    phase: "loading",
    players: {},
    units: [],
    buildings: [],
    projectiles: [],
    arcana: 0
  },

  getRenderState: () => {
    const now = Date.now();
    const renderTimestamp = now - INTERPOLATION_DELAY;

    // 1. Cari dua snapshot: satu sebelum renderTime, satu sesudah renderTime
    // Buffer diurutkan dari lama -> baru
    
    let previous = null;
    let next = null;

    for (let i = stateBuffer.length - 1; i >= 0; i--) {
        if (stateBuffer[i].timestamp <= renderTimestamp) {
            previous = stateBuffer[i];
            next = stateBuffer[i + 1]; // State tepat setelah previous
            break;
        }
    }

    // A. Kalau belum punya data masa lalu (awal game/lag parah), pakai data paling lama
    if (!previous) {
        return stateBuffer[0] || null; 
    }
    
    // B. Kalau tidak ada masa depan (koneksi putus/packet loss), pakai data terakhir
    if (!next) {
        return previous; 
    }

    // C. INTERPOLASI!
    // Hitung persentase waktu (alpha) antara 0.0 sampai 1.0
    const timeTotal = next.timestamp - previous.timestamp;
    const timeElapsed = renderTimestamp - previous.timestamp;
    let alpha = timeElapsed / timeTotal;
    
    // Clamp alpha (jaga-jaga)
    if (alpha < 0) alpha = 0;
    if (alpha > 1) alpha = 1;

    // Kita buat objek state "palsu" hasil campuran
    return interpolateStates(previous, next, alpha);
  },

  set(newState) {
    this.data = newState;
    listeners.forEach(fn => fn(this.data));
  },
  setMyTeam(id) {
    myTeamId = id;
    console.log("I am now playing as Team:", id);
  },
  
  // Getter
  getMyTeam() {
    return myTeamId;
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};


export function onStateUpdate(newState) {
    // Masukkan ke buffer
    stateBuffer.push(newState);
    
    // Hapus data yang terlalu lama (lebih dari 1 detik) biar ram irit
    if (stateBuffer.length > 30) {
        stateBuffer.shift();
    }

    // Notify listeners (UI tetap pakai data terbaru biar instan)
    listeners.forEach(cb => cb(newState));
}

// === MATH MAGIC: Mencampur dua state ===
function interpolateStates(prev, next, alpha) {
    // Kita copy struktur 'next' sebagai base
    const interpolated = { ...next };

    // 1. INTERPOLASI UNITS
    interpolated.units = next.units.map(nextUnit => {
        // Cari unit yang sama di masa lalu
        const prevUnit = prev.units.find(u => u.id === nextUnit.id);
        
        if (!prevUnit) {
            // Unit baru lahir? Tidak bisa interpolasi, langsung muncul
            return nextUnit; 
        }

        // Lerp (Linear Interpolation) posisi
        const lerpCol = prevUnit.col + (nextUnit.col - prevUnit.col) * alpha;
        const lerpRow = prevUnit.row + (nextUnit.row - prevUnit.row) * alpha;

        return {
            ...nextUnit,
            col: lerpCol,
            row: lerpRow
        };
    });

    // 2. PROJECTILES (Opsional, tapi bagus kalau diinterpolasi juga)
    interpolated.projectiles = next.projectiles.map(nextProj => {
        const prevProj = prev.projectiles.find(p => p.id === nextProj.id);
        if (!prevProj) return nextProj;

        return {
            ...nextProj,
            col: prevProj.col + (nextProj.col - prevProj.col) * alpha,
            row: prevProj.row + (nextProj.row - prevProj.row) * alpha
        };
    });

    return interpolated;
}
