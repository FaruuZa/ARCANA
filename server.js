const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// --- IMPORTS ---
const { CARDS, CONFIG, TOWER_DATA } = require("./data_server");
const { Unit, Building, Tower } = require("./entity_server");
const Utils = require("./utils_server");
const Projectile = require("./projectile");

app.use(express.static("public"));

// --- SERVER GAME ENGINE CLASS ---
class ServerGame {
  constructor() {
    this.units = [];
    this.buildings = [];
    this.towers = [];
    this.projectiles = [];

    // Visual Events (Ledakan, Spawn, dll)
    this.visualEvents = [];
    this.effects = []; // Container effect sementara

    // Resource Global (Sementara Shared, nanti per-player)
    this.elixir = 10;

    // --- FACTION ASSIGNMENT ---
    this.factions = {};
    // FIXED: Player 0 = Noctis, Player 1 = Solaris
    this.factions[0] = "noctis";
    this.factions[1] = "solaris";

    // Init Arena
    this.initArena();

    this.frameCount = 0;
  }

  initArena() {
    // Setup Tower Standar (Blue vs Red)
    this.towers = [
      new Tower(100, 560, 0, "princess"),
      new Tower(340, 560, 0, "princess"),
      new Tower(220, 660, 0, "king"),
      new Tower(220, 630, 0, "king"), // Geser agar tidak mepet bawah
      new Tower(100, 140, 1, "princess"),
      new Tower(340, 140, 1, "princess"),
      new Tower(220, 40, 1, "king"),
      new Tower(220, 70, 1, "king"), // Geser agar tidak mepet atas
    ];
  }

  // Helper Broadcast Effect (Dipanggil oleh Entity/Projectile)
  broadcastEffect(type, x, y, radius, color) {
    this.visualEvents.push({ type, x, y, radius, color });
  }

  // Helper Deal Area Damage (Dipanggil oleh Entity)
  dealAreaDamage(x, y, radius, dmg, team, type = "damage", hitAir = true) {
    const targets = [...this.units, ...this.buildings, ...this.towers];
    for (let t of targets) {
      // Logic Damage Standard
      if (t.team === team && type !== "rage") continue;
      if (t.team !== team && type === "rage") continue;
      if (t.isHidden) continue;
      if (t.tags && t.tags.includes("air") && !hitAir) continue;

      if (!t.dead && Utils.getDist({ x, y }, t) < radius + t.radius) {
        if (type === "damage") t.takeDamage(dmg);
        else if (type === "stun") t.applyStun(0.5, "zap");
        else if (type === "rage") t.applyRage(0.4);
      }
    }
  }

  spawnCard(key, x, y, team) {
    const card = CARDS[key];
    if (!card) return;

    if (card.type === "unit") {
      const count = card.stats.count || 1;
      for (let i = 0; i < count; i++) {
        let ox = 0,
          oy = 0;
        if (count > 1) {
          if (count > 4) {
            const angle = ((Math.PI * 2) / count) * i;
            ox = Math.cos(angle) * 30;
            oy = Math.sin(angle) * 30;
          } else {
            ox = (i - (count - 1) / 2) * 20;
          }
        }

        const u = new Unit(x + ox, y + oy, team, key);
        u.id = Math.random().toString(36).substr(2, 9); // ID Unik
        this.units.push(u);
      }
    } else if (card.type === "building") {
      const b = new Building(x, y, team, key);
      b.id = Math.random().toString(36).substr(2, 9);
      this.buildings.push(b);
    }
    // Spell logic bisa ditambahkan nanti
  }

  update() {
    this.frameCount++;

    // Regen Elixir
    if (this.elixir < CONFIG.maxElixir)
      this.elixir += 0.016 * CONFIG.baseElixirRate;

    // Update Entities
    [...this.units, ...this.buildings, ...this.towers].forEach((e) =>
      e.update(this),
    );
    this.projectiles.forEach((p) => p.update(this));

    // Cleanup Dead Entities
    this.units = this.units.filter((u) => !u.dead);
    this.buildings = this.buildings.filter((b) => !b.dead);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.towers = this.towers.filter((t) => !t.dead);
  }

  getStatePacket() {
    const packet = {
      elixir: this.elixir,
      units: this.units.map((u) => ({
        id: u.id,
        key: u.key,
        team: u.team,
        x: Math.round(u.x),
        y: Math.round(u.y),
        hp: Math.round(u.hp),
        maxHp: u.maxHp,
        angle: u.angle,
        deployTimer: u.deployTimer,
        isAttacking: u.isAttacking,
      })),
      towers: this.towers.map((t) => ({
        type: t.type,
        team: t.team,
        x: t.x,
        y: t.y,
        hp: Math.round(t.hp),
        maxHp: t.maxHp,
        active: t.active,
        angle: t.angle,
      })),
      buildings: this.buildings.map((b) => ({
        id: b.id,
        key: b.key,
        team: b.team,
        x: b.x,
        y: b.y,
        hp: Math.round(b.hp),
        maxHp: b.maxHp,
      })),
      projectiles: this.projectiles.map((p) => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
        type: p.projType,
      })),
      events: [
        ...this.visualEvents,
        ...this.effects.map((e) => ({
          x: e.x,
          y: e.y,
          radius: e.radius,
          color: e.color,
        })),
      ],
    };

    // Reset Events
    this.visualEvents = [];
    this.effects = [];

    return packet;
  }
}

// --- INSTANCE GAME ---
const game = new ServerGame();

// --- SOCKET IO ---
// STATE PEMAIN KONEK
const connectedPlayers = {}; // Format: { socketId: teamId }

// --- HANDLER SOCKET ---
io.on("connection", (socket) => {
  // 1. CARI SLOT TIM YANG KOSONG
  // Cek apakah Tim 0 sudah ada?
  const team0Taken = Object.values(connectedPlayers).includes(0);
  // Cek apakah Tim 1 sudah ada?
  const team1Taken = Object.values(connectedPlayers).includes(1);

  let team = -1;

  if (!team0Taken) {
    team = 0; // Masuk ke Tim Biru
  } else if (!team1Taken) {
    team = 1; // Masuk ke Tim Merah
  } else {
    // Jika penuh, jadikan Spectator (-1) atau tolak
    console.log("Room Full, spectator joined:", socket.id);
    socket.emit("roomFull"); // Bisa ditangani di client nanti
    // Untuk prototype, kita biarkan connect tapi team -1 (tidak bisa spawn)
  }

  // Simpan data pemain
  if (team !== -1) {
    connectedPlayers[socket.id] = team;
    console.log(`Player join: ${socket.id} assigned to TEAM ${team}`);
  }

  // Kirim info ke client
  socket.emit("initGame", {
    team: team,
    elixir: game.elixir,
    factions: game.factions,
  });
    // 2. HANDLER SPAWN REQUEST
  socket.on("requestSpawn", (data) => {
    const team = connectedPlayers[socket.id];
    if (team === undefined) return;

    const card = CARDS[data.key];
    if (!card) return;

    if (game.elixir < card.cost) return;

    if (!isValidZone(team, data)) return;

    game.elixir -= card.cost;
    game.spawnCard(data.key, data.x, data.y, team);

    socket.emit("spawnResult", { ok: true });
  });

  // 3. Handler Disconnect (Kosongkan Slot)
  socket.on("disconnect", () => {
    const t = connectedPlayers[socket.id];
    if (t !== undefined) {
      console.log(`Player disconnected from TEAM ${t}`);
      delete connectedPlayers[socket.id];
    }
  });
});

// --- GAME LOOP (60 FPS) ---
setInterval(() => {
  game.update();
  io.emit("stateUpdate", game.getStatePacket());
}, 1000 / 60);

http.listen(3000, () => console.log("Server Clash (No Bot) Running on 3000"));
