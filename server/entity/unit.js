import { BASE_SPEED_TILES_PER_SEC } from "../../shared/constants.js";

export function createUnit(data) {
  // Setup Nilai Default
  const rawHp = data.hp ?? 100;
  const rawDamage = data.damage ?? 10;
  const rawSpeed = data.speed ?? BASE_SPEED_TILES_PER_SEC;
  const rawAttackSpeed = data.attackSpeed ?? 1.0;
  const rawRadius = data.radius ?? 0.5;
  const rawRange = data.range ?? 1.0;
  const rawAoe = data.aoeRadius ?? 0;

  return {
    // ... Identitas ...
    id: data.id,
    team: data.team,
    cardId: data.cardId,
    entityType: "unit",

    // ... Posisi ...
    lane: data.lane,
    col: data.col,
    row: data.row,

    // === [NEW] BASE STATS (Statistik Murni) ===
    // Kita simpan ini sebagai acuan perhitungan ulang
    baseMaxHp: rawHp,
    baseDamage: rawDamage,
    baseSpeed: rawSpeed,
    baseAttackSpeed: rawAttackSpeed,
    baseRange: data.range,
    // [NEW] Base Range & AoE
    baseRange: rawRange,
    baseAoeRadius: rawAoe,

    // === CURRENT STATS (Yang dipakai Logic Game) ===
    // Nanti buffSystem yang akan otak-atik nilai ini
    hp: rawHp,
    maxHp: rawHp,
    damage: rawDamage,
    speed: rawSpeed,
    attackSpeed: rawAttackSpeed,
    range: data.range,
    sightRange: data.sightRange || 5.0,

    deployTime: data.deployTime || 1.0,
    aimTime: data.aimTime || 0.5,
    attackCooldown: 0,

    // ... Targeting ...
    movementType: data.movementType || "ground",
    targetTeam: data.targetTeam || "enemy",
    targetRule: data.targetRule || "any",
    targetHeight: data.targetHeight || "both",

    // ... Optional ...
    aoeRadius: data.aoeRadius || 0,
    aoeType: data.aoeType || "target",
    projectileType: data.projectileType || null,

    // ... State ...
    state: "spawning",
    stateTimer: data.deployTime || 1.0,
    intent: { type: "idle", targetId: null },

    traits: data.traits || {},
    chargeTimer: 0,
    isCharging: false,
    jumpCooldown: 0,
    isJumping: false,
    jumpTargetPos: null,
    isChannelingJump: false,
    jumpWindupTimer: 0,
    isCrossing: false,
    isDead: false,

    // === SIZE STATS ===
    baseRadius: rawRadius, // Ukuran asli (acuan reset)
    radius: rawRadius, // Ukuran fisik saat ini (Collision)
    scale: 1.0, // Multiplier visual & fisik (kena buff gigantify)

    aoeRadius: rawAoe,
    aoeType: data.aoeType || "target",
    // === BUFF STORAGE ===
    // Array untuk menyimpan efek aktif: { type, value, duration, id, sourceId, tickTimer }
    buffs: [],

    // Status Flags (Reset tiap tick)
    isStunned: false,
    isRooted: false, // Bisa nyerang, gabisa jalan
    isSilenced: false, // Gabisa skill/ult
  };
}
