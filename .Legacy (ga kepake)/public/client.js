const socket = io();
const statusEl = document.getElementById("status");

// --- GLOBAL VARIABLES ---
let myTeam = -1;
const LOGIC_WIDTH = 440;
const LOGIC_HEIGHT = 700;

// --- DECK MANAGEMENT (QUEUE SYSTEM) ---
const MY_DECK = [
  "knight",
  "archer",
  "giant",
  "fireball",
  "mini_pekka",
  "musketeer",
  "skeleton_army",
  "baby_dragon",
];

let deckQueue = [];
let handCards = [];

function initDeck() {
  let shuffled = [...MY_DECK].sort(() => Math.random() - 0.5);
  handCards = shuffled.slice(0, 4);
  deckQueue = shuffled.slice(4);
}

initDeck();
let selectedCardIdx = -1;

// --- GAME STATE ---
const clientGameState = {
  scale: 1,
  towers: [],
  buildings: [],
  units: [],
  projectiles: [],
  effects: [],
  spellAreas: [],
  pendingSpells: [],
  playerHand: [],
  selectedCardIdx: -1,
  elixir: 5,
  mouseX: 0,
  mouseY: 0,

  // [FIX] VALIDASI PLACEMENT
  checkPlacement: (x, y, type, radius = 20) => {
    const t = type ? type.toUpperCase() : "UNIT";

    // 1. Batas Kiri/Kanan (Padding 20px)
    if (x < 20 || x > CONFIG.logicWidth - 20) return false;

    // SPELL: Valid di mana saja (kecuali Log ada aturan khusus, tapi default true)
    if (t === "SPELL" || t === "RITUAL") {
      return true;
    }

    // 2. Batas Atas/Bawah (Area Musuh & Sungai)
    if (y < 330) return false;
    if (y > 335 && y < 365) return false;

    // 3. Tabrakan Bangunan
    if (t === "BUILDING" || t === "SANCTUM") {
      const obstacles = [
        ...clientGameState.buildings,
        ...clientGameState.towers,
      ];
      for (let o of obstacles) {
        const dist = Math.hypot(x - o.x, y - o.y);
        if (dist < o.radius + radius - 5) return false;
      }
    }
    return true;
  },
};

const renderer = new Renderer();

Utils.resize(clientGameState);
window.addEventListener("resize", () => Utils.resize(clientGameState));

// ==========================================
// UI LOGIC (TAROT FAN STYLE)
// ==========================================
const toRoman = (num) =>
  ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][num] || num;
const TYPE_MAP = { UNIT: "VESSEL", SPELL: "RITUAL", BUILDING: "SANCTUM" };

function renderHandUI(enteringIndex = -1) {
  const handContainer = document.getElementById("hand-cards");

  if (!handContainer) return;

  handContainer.innerHTML = "";

  const totalCards = handCards.length;
  // [FIX] Dynamic Spacing agar muat di Mobile
  const screenW =
    document.getElementById("game-viewport")?.clientWidth || window.innerWidth;
  const spacing = Math.min(85, screenW / 4.5);

  handCards.forEach((cardKey, index) => {
    const cardData = CARDS[cardKey];
    if (!cardData) return;

    const cardEl = document.createElement("div");
    cardEl.className = "hand-card";
    cardEl.dataset.index = index;

    // Hitung Offset dari tengah
    const centerIdx = (totalCards - 1) / 2;
    const dist = index - centerIdx; // Contoh: -1.5, -0.5, 0.5, 1.5

    // 1. Horizontal Spread (X)
    const xVal = dist * spacing;
    // 2. Rotasi Ringan (Fan) - Dikurangi biar lebih tegak
    const rotVal = dist * 3;
    // 3. Vertical Arch (Sisi sedikit turun)
    const yVal = Math.abs(dist) * 10;

    // Set CSS Variables
    cardEl.style.setProperty("--x", `${xVal}px`);
    cardEl.style.setProperty("--rot", `${rotVal}deg`);
    cardEl.style.setProperty("--y", `${yVal}px`);

    // Z-index bertingkat
    cardEl.style.zIndex = index + 1;

    if (index === enteringIndex) {
      cardEl.classList.add("entering");
    }

    const typeLabel = TYPE_MAP[cardData.type] || "VESSEL";

    cardEl.innerHTML = `
            <div class="card-cost">${toRoman(cardData.cost)}</div>
            <div class="card-type">${typeLabel}</div>
            <div class="card-desc">${cardData.desc || "The threads of fate are woven."}</div>
            <div class="card-name">${cardData.name}</div>
        `;

    cardEl.onclick = () => {
      if (clientGameState.elixir < cardData.cost) {
        const costEl = cardEl.querySelector(".card-cost");
        if (costEl) {
          costEl.classList.remove("shake-cost");
          void costEl.offsetWidth; // Trigger reflow untuk restart animasi
          costEl.classList.add("shake-cost");

          // [FIX] Hapus class setelah animasi selesai agar warna merah hilang
          if (costEl.shakeTimeout) clearTimeout(costEl.shakeTimeout);
          costEl.shakeTimeout = setTimeout(() => {
            costEl.classList.remove("shake-cost");
          }, 300);
        }
        return;
      }
      selectedCardIdx = selectedCardIdx === index ? -1 : index;
      updateClientState();
      updateHandVisuals();
    };

    // Hover effect logic manual jika perlu, tapi CSS :hover sudah cukup kuat
    // Kita tambahkan event listener untuk reset z-index jika perlu

    handContainer.appendChild(cardEl);
  });
  updateHandVisuals();
}

function updateHandVisuals() {
  const cards = document.querySelectorAll(".hand-card");

  cards.forEach((cardEl, index) => {
    const cardKey = handCards[index];
    const cardData = CARDS[cardKey];
    if (!cardData) return;

    cardEl.classList.remove("active", "disabled");

    // Jika dipilih, tambahkan class active (CSS akan override transform)
    if (index === selectedCardIdx) {
      cardEl.classList.add("active");
    }
    // Jika tidak dipilih, kembalikan ke posisi kipas (inline style tetap ada)

    if (clientGameState.elixir < cardData.cost)
      cardEl.classList.add("disabled");
  });
}

function cycleCard(usedIndex) {
  const usedCard = handCards[usedIndex];
  const nextCard = deckQueue.shift();
  handCards[usedIndex] = nextCard;
  deckQueue.push(usedCard);

  selectedCardIdx = -1;
  updateClientState();
  renderHandUI(usedIndex); // Beritahu index mana yang baru masuk untuk animasi
}

function updateClientState() {
  clientGameState.playerHand = handCards;
  clientGameState.selectedCardIdx = selectedCardIdx;
}

renderHandUI();

// ==========================================
// SOCKET
// ==========================================
socket.on("connect", () => {
  statusEl.innerText = "ID: " + socket.id;
});
socket.on("initGame", (data) => {
  myTeam = data.team;
  clientGameState.factions = data.factions;
  statusEl.innerText = `Team: ${data.team === 0 ? "BLUE" : "RED"} [${data.factions[data.team].toUpperCase()}]`;
});

socket.on("stateUpdate", (packet) => {
  if (packet.elixir !== undefined) {
    clientGameState.elixir = packet.elixir;
    const pct = (packet.elixir / 10) * 100;
    const fillEl = document.getElementById("elixir-fill");
    const textEl = document.getElementById("elixir-text");
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (textEl) {
      textEl.innerText = toRoman(Math.floor(packet.elixir));
      // Warna teks berubah jika penuh (Arcana Overflow)
      textEl.style.color = packet.elixir >= 10 ? "#e040fb" : "#e0e0e0";
      textEl.style.textShadow =
        packet.elixir >= 10 ? "0 0 15px #9c27b0" : "none";
    }
    updateHandVisuals();
  }
  clientGameState.myTeam = myTeam; // Inject myTeam info for Renderer

  const transformPos = (obj) => {
    if (myTeam === 1) {
      return {
        ...obj,
        x: LOGIC_WIDTH - obj.x,
        y: LOGIC_HEIGHT - obj.y,
        angle: obj.angle !== undefined ? obj.angle + Math.PI : 0,
      };
    }
    return obj;
  };

  // Mapping standar
  clientGameState.units = packet.units.map((e) => {
    const tPos = transformPos(e);
    const cardData = CARDS[e.key] || {};
    return {
      ...tPos,
      isUnit: true,
      visuals: cardData.visuals || {},
      radius: cardData.tags && cardData.tags.includes("heavy") ? 16 : 9,
      isAir: cardData.tags ? cardData.tags.includes("air") : false,
      isAttacking: e.isAttacking || false,
      isMoving: true,
    };
  });
  if (packet.towers)
    clientGameState.towers = packet.towers.map((t) => {
      const tPos = transformPos(t);
      return {
        ...tPos,
        isTower: true,
        radius: TOWER_DATA[t.type].radius,
        range: TOWER_DATA[t.type].range * CONFIG.gridSize,
        visuals: TOWER_DATA[t.type].visuals || {},
      };
    });
  if (packet.buildings)
    clientGameState.buildings = packet.buildings.map((b) => {
      const tPos = transformPos(b);
      const cardData = CARDS[b.key] || {};
      return { ...tPos, isBuilding: true, visuals: cardData.visuals || {} };
    });
  else clientGameState.buildings = [];
  if (packet.projectiles)
    clientGameState.projectiles = packet.projectiles.map((p) => {
      const tPos = transformPos(p);
      return {
        x: tPos.x,
        y: tPos.y,
        projType: p.type,
        rotation:
          Math.atan2(p.vy || 0, p.vx || 0) + (myTeam === 1 ? Math.PI : 0),
      };
    });
  if (packet.events)
    packet.events.forEach((ev) => {
      const tPos = transformPos(ev);
      clientGameState.effects.push(
        new Effect(tPos.x, tPos.y, ev.radius, ev.color),
      );
    });

  renderer.renderGame(clientGameState);
});

// ==========================================
// INPUT HANDLING (ABSOLUTE PRECISION)
// ==========================================

const getLogicPos = (e) => {
  const rect = CANVAS.getBoundingClientRect();

  // 1. Ambil posisi mouse relatif terhadap elemen Canvas (termasuk border)
  let clientX = e.touches ? e.touches[0].clientX : e.clientX;
  let clientY = e.touches ? e.touches[0].clientY : e.clientY;

  // 2. Konversi ke Koordinat Bitmap Canvas (Resolusi Internal)
  const mousePixelX = (clientX - rect.left) * (CANVAS.width / rect.width);
  const mousePixelY = (clientY - rect.top) * (CANVAS.height / rect.height);

  // 3. Hitung Offset Centering (Sama persis dengan logika Renderer)
  const screenW = CANVAS.width / clientGameState.scale;
  const offsetX = (screenW - LOGIC_WIDTH) / 2;
  const finalOffsetX = offsetX > 0 ? offsetX : 0;

  // 4. Konversi ke Logic Coordinate (Kurangi Offset)
  let x = mousePixelX / clientGameState.scale - finalOffsetX;
  let y = mousePixelY / clientGameState.scale;

  return { x, y };
};

const handleMouseMove = (e) => {
  if (selectedCardIdx === -1) return;
  const pos = getLogicPos(e);
  clientGameState.mouseX = pos.x;
  clientGameState.mouseY = pos.y;
};

const handleInput = (e) => {
  if (e.target.closest("#bottom-panel")) return;
  if (selectedCardIdx === -1) return;

  const pos = getLogicPos(e);
  let { x, y } = pos;

  // [FIX] Snap to Grid agar konsisten dengan Ghost Visual
  // Ini memperbaiki bug di mana klik di pinggir (misal x=19) gagal tapi ghost (x=20) hijau
  x = Math.round(x / CONFIG.gridSize) * CONFIG.gridSize;
  y = Math.round(y / CONFIG.gridSize) * CONFIG.gridSize;

  const cardKey = handCards[selectedCardIdx];
  const cardData = CARDS[cardKey];

  // [FIX] Validasi Ketat: Jika Salah Posisi, JANGAN KIRIM
  if (!clientGameState.checkPlacement(x, y, cardData.type)) {
    // Feedback visual kecil di console
    // Ghost merah sudah diurus renderer
    return;
  }

  // Cek Elixir
  if (clientGameState.elixir < cardData.cost) return;

  if (myTeam === 1) {
    x = LOGIC_WIDTH - x;
    y = LOGIC_HEIGHT - y;
  }

  socket.emit("requestSpawn", { key: cardKey, x: x, y: y });

  socket.on("spawnResult", (res) => {
    if (!res.ok) return;
    cycleCard(usedIdx);
  });

  // ANIMASI KARTU DIGUNAKAN
  const usedIdx = selectedCardIdx;
  const cardEl = document.querySelector(`.hand-card[data-index="${usedIdx}"]`);

  selectedCardIdx = -1; // Deselect segera agar tidak bisa diklik lagi
  updateClientState();

  if (cardEl) {
    cardEl.classList.add("using"); // Trigger animasi CSS
    // Tunggu animasi selesai baru cycle data
    setTimeout(() => cycleCard(usedIdx), 300);
  } else {
    cycleCard(usedIdx);
  }
};

CANVAS.addEventListener("mousedown", handleInput);
CANVAS.addEventListener("touchstart", handleInput, { passive: false });
CANVAS.addEventListener("mousemove", handleMouseMove);
