const CONFIG = {
  baseElixirRate: 0.6,
  maxElixir: 10,
  botThinkRate: 1500,
  logicWidth: 440,
  logicHeight: 700,
  gridSize: 20,
};

// TOWER DATA (Arcane Towers)
const TOWER_DATA = {
  king: {
    name: "The Sovereign", hp: 4000, dmg: 110, range: 10, hitSpeed: 1.0, radius: 30, color: "#ffd700",
    targetType: 'ground-air',
    projectile: { type: 'normal', speed: 7 }
  },
  princess: {
    name: "Arcane Sentry", hp: 2500, dmg: 90, range: 8.6, hitSpeed: 0.8, radius: 25, color: "#b388ff",
    targetType: 'ground-air',
    projectile: { type: 'normal', speed: 9 }
  },
  tesla_tower: {
    name: "Storm Pillar", hp: 3000, dmg: 190, range: 6.0, hitSpeed: 1.1, radius: 25, color: "#0288d1",
    targetType: 'ground-air',
    projectile: { type: 'instant', visual: 'lightning' }
  }
};

const CARDS = {
  // --- MAJOR ARCANA (Win Conditions & Tanks) ---
  giant: {
    name: "The Titan", cost: 5, icon: "V", type: "UNIT", // Roman Numeral V
    stats: { hp: 3500, dmg: 211, hitSpeed: 1.5, speed: 0.7, range: 0, targetType: 'ground-only' },
    tags: ["ground", "win_condition", "tank", "building-hunter", "heavy", "melee", "single"],
    visuals: { scale: 1.5, skin: "#d7ccc8", head: "bald", body: "ancient_armor", weapon: "fist_giant", color: "#5d4037" },
    desc: "Raksasa kuno yang hanya memandang struktur lawan. Langkahnya adalah gempa.",
  },
  royal_giant: {
    name: "The Colossus", cost: 6, icon: "VI", type: "UNIT",
    stats: { hp: 2544, dmg: 254, hitSpeed: 1.7, speed: 0.6, range: 5.5, targetType: 'ground-only', projectile: { type: 'normal', speed: 8 } },
    tags: ["ground", "win_condition", "tank", "building-hunter", "heavy", "ranged"],
    visuals: { scale: 1.4, skin: "#d7ccc8", head: "helmet_open", body: "armor_heavy", weapon: "cannon_hand", accessory: "cape_tattered", color: "#3e2723" },
    desc: "Membawa meriam leluhur untuk meruntuhkan benteng dari kejauhan.",
  },
  hog_rider: {
    name: "The Rider", cost: 4, icon: "IV", type: "UNIT",
    stats: { hp: 1408, dmg: 264, hitSpeed: 1.6, speed: 1.8, range: 0, targetType: 'ground-only' },
    tags: ["ground", "win_condition", "building-hunter", "fast", "river-jumper", "melee", "single"],
    visuals: { scale: 1.1, skin: "#8d6e63", head: "mohawk", body: "pig", weapon: "hammer", color: "#795548" },
    desc: "Melompati sungai takdir untuk menghantam jantung pertahanan.",
  },

  // --- MINOR ARCANA (Fighters) ---
  knight: {
    name: "The Vanguard", cost: 3, icon: "III", type: "UNIT",
    stats: { hp: 1450, dmg: 165, hitSpeed: 1.2, speed: 1.0, range: 0, targetType: 'ground-only', sightRange: 5.5 },
    tags: ["ground", "mini_tank", "melee", "single"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "helmet", body: "armor_plate", weapon: "sword", accessory: "cape_royal", color: "#1976d2" },
    desc: "Pelindung setia yang berdiri di garis depan pertempuran.",
  },
  mini_pekka: {
    name: "The Sentinel", cost: 4, icon: "IV", type: "UNIT",
    stats: { hp: 1129, dmg: 598, hitSpeed: 1.8, speed: 1.6, range: 0, targetType: 'ground-only' },
    tags: ["ground", "dps", "tank_killer", "fast", "melee", "single"],
    visuals: { scale: 1.0, skin: "#607d8b", head: "robot_horn", body: "armor_plate", weapon: "sword", color: "#90caf9" },
    desc: "Konstruk logam dengan satu tujuan: Pemusnahan.",
  },
  valkyrie: {
    name: "The Whirlwind", cost: 4, icon: "IV", type: "UNIT",
    stats: { hp: 1650, dmg: 220, hitSpeed: 1.5, speed: 1.0, range: 0, targetType: 'ground-only', splashRadius: 2.5, meleeType: 'circular' },
    tags: ["ground", "mini_tank", "melee", "aoe"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "hair_orange", body: "cloth", weapon: "axe_double", accessory: "cape_tattered", color: "#ff7043" },
    desc: "Tarian kematian yang menyapu semua musuh di sekitarnya.",
  },
  
  // --- MYSTIC ARCANA (Ranged & Magic) ---
  archer: {
    name: "The Twins", cost: 3, icon: "III", type: "UNIT",
    stats: { hp: 270, dmg: 93, hitSpeed: 1.0, speed: 1.1, range: 5.0, count: 2, targetType: 'ground-air', projectile: { type: 'normal', speed: 10 } },
    tags: ["ground", "ranged", "air_defense", "support"],
    visuals: { scale: 0.9, skin: "#f0ceab", head: "hood", body: "cloth", weapon: "bow", accessory: "cape_tattered", color: "#ec407a" },
    desc: "Dua jiwa, satu tujuan. Panah mereka menembus langit.",
  },
  musketeer: {
    name: "The Marksman", cost: 4, icon: "IV", type: "UNIT",
    stats: { hp: 600, dmg: 181, hitSpeed: 1.1, speed: 1.0, range: 6.0, targetType: 'ground-air', projectile: { type: 'normal', speed: 9 } },
    tags: ["ground", "ranged", "dps", "air_defense"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "helmet", body: "cloth", weapon: "musket", color: "#7b1fa2" },
    desc: "Akurasi mematikan dari jarak jauh.",
  },
  baby_dragon: {
    name: "The Wyrm", cost: 4, icon: "IV", type: "UNIT",
    stats: { hp: 1000, dmg: 133, hitSpeed: 1.5, speed: 1.1, range: 3.5, targetType: 'ground-air', splashRadius: 1.5, projectile: { type: 'spit_fire', speed: 9 } },
    tags: ["air", "ranged", "aoe", "tank", "air_defense"],
    visuals: { scale: 1.2, skin: "#4caf50", head: "helmet_viking", body: "dragon", weapon: "none", accessory: "wings_dragon", color: "#4caf50" },
    desc: "Naga muda yang menyemburkan api area dari angkasa.",
  },
  skeleton_army: {
    name: "The Horde", cost: 3, icon: "III", type: "UNIT",
    stats: { hp: 69, dmg: 64, hitSpeed: 1.0, speed: 1.4, range: 0, count: 15, targetType: 'ground-only' },
    tags: ["ground", "swarm", "dps", "tank_killer", "melee", "single"],
    visuals: { scale: 0.7, skin: "#ffffff", head: "skull", body: "ribs", weapon: "dagger", color: "#eeeeee" },
    desc: "Legiun jiwa-jiwa gelisah yang bangkit bersamaan.",
  },

  // --- SPELLS (Rituals) ---
  fireball: { 
    name: "Solar Flare", cost: 4, icon: "IV", type: "SPELL", 
    tags: ["spell", "spell_dmg_medium"], 
    stats: { dmg: 572, radius: 2.5, spawnDelay: 1.0 },
    desc: "Memanggil murka matahari untuk menghanguskan area."
  },
  arrows: { 
    name: "Rain of Steel", cost: 3, icon: "III", type: "SPELL", 
    tags: ["spell", "spell_dmg_light", "aoe"], 
    stats: { dmg: 243, radius: 4.0, spawnDelay: 0.8 },
    desc: "Hujan anak panah yang menutupi langit."
  },
  
  // --- TOKENS ---
  skeleton: {
    name: "Bone", cost: 1, icon: "I", type: "UNIT",
    stats: { hp: 67, dmg: 67, hitSpeed: 1.0, speed: 1.4, range: 0, targetType: 'ground-only' },
    tags: ["ground"], hiddenInDeck: true,
    visuals: { scale: 0.7, skin: "#fff", head: "skull", body: "ribs", weapon: "dagger" }
  }
};
