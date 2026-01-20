const stateBuffer = [];
const INTERPOLATION_DELAY = 100; // ms

// Menggunakan Set agar listener unik
const listeners = new Set();

export let myTeamId = -1;

export const gameState = {
  // [FIX] Flat Properties (Langsung di root, bukan di dalam .data)
  // Ini inisialisasi awal agar tidak error saat diakses sebelum data server masuk
  players: {}, 
  units: [],
  buildings: [],
  projectiles: [],
  effects: [],
  phase: "loading",
  winner: null,
  arcana: 0,

  // Fungsi Interpolasi (Untuk Renderer)
  getRenderState: () => {
    const now = Date.now();
    const renderTimestamp = now - INTERPOLATION_DELAY;

    let previous = null;
    let next = null;

    for (let i = stateBuffer.length - 1; i >= 0; i--) {
        if (stateBuffer[i].timestamp <= renderTimestamp) {
            previous = stateBuffer[i];
            next = stateBuffer[i + 1]; 
            break;
        }
    }

    if (!previous) return stateBuffer[0] || null; 
    if (!next) return previous; 

    const timeTotal = next.timestamp - previous.timestamp;
    const timeElapsed = renderTimestamp - previous.timestamp;
    let alpha = timeElapsed / timeTotal;
    
    if (alpha < 0) alpha = 0;
    if (alpha > 1) alpha = 1;

    return interpolateStates(previous, next, alpha);
  },

  // Setter manual (dipakai socket.js saat welcome/init)
  set(newState) {
    onStateUpdate({ ...newState, timestamp: Date.now() });
  },

  setMyTeam(id) {
    myTeamId = id;
    console.log("I am now playing as Team:", id);
  },
  
  getMyTeam() {
    return myTeamId;
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};

// Fungsi update dari Socket
export function onStateUpdate(newState) {
    // 1. Masukkan ke buffer (untuk Interpolasi Renderer)
    stateBuffer.push(newState);
    
    // Hapus data lama
    if (stateBuffer.length > 20) {
        stateBuffer.shift();
    }

    // 2. [CRITICAL FIX] Update Properti Utama gameState (Sync)
    // Ini agar pointer.js, ui.js, dan ghost.js bisa baca data TERBARU secara langsung
    // tanpa perlu lewat getRenderState (karena UI butuh respons instan/realtime)
    gameState.players = newState.players || {};
    gameState.units = newState.units || [];
    gameState.buildings = newState.buildings || [];
    gameState.projectiles = newState.projectiles || [];
    gameState.effects = newState.effects || [];
    gameState.phase = newState.phase;
    gameState.winner = newState.winner;
    
    // 3. Notify listeners (UI)
    listeners.forEach(fn => fn(newState));
}

// === MATH MAGIC: Mencampur dua state ===
function interpolateStates(prev, next, alpha) {
    const interpolated = { ...next };

    // Interpolasi Unit
    interpolated.units = next.units.map(nextUnit => {
        const prevUnit = prev.units.find(u => u.id === nextUnit.id);
        if (!prevUnit) return nextUnit; 

        const lerpCol = prevUnit.col + (nextUnit.col - prevUnit.col) * alpha;
        const lerpRow = prevUnit.row + (nextUnit.row - prevUnit.row) * alpha;

        return {
            ...nextUnit,
            col: lerpCol,
            row: lerpRow
        };
    });

    // Interpolasi Projectiles
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