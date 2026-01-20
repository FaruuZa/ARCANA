export const CARDS = {
  // 1. VESSEL BIASA (Default)
  "vessel_01": {
    id: "vessel_01",
    name: "Iron Vessel",
    type: "VESSEL",
    cost: 3,
    stats: {
      hp: 150, damage: 20, range: 1.5, sightRange: 5.5, speed: 4.0, attackSpeed: 1.0,
      deployTime: 1.0, aimTime: 0.1,
      
      // TAMBAHAN WAJIB
      movementType: 'ground',
      targetTeam: 'enemy',
      targetRule: 'any',
      targetHeight: 'both'
    }
  },
  
  // 2. RANGER (Bisa nembak udara)
  "vessel_02": {
    id: "vessel_02",
    name: "Ranger",
    type: "VESSEL",
    cost: 4,
    stats: {
      hp: 60, damage: 30, range: 4.5, sightRange: 6.5, speed: 5.0, attackSpeed: 1.3,
      deployTime: 1.0, aimTime: 0.8,
      
      // TAMBAHAN WAJIB
      movementType: 'ground',
      targetTeam: 'enemy',
      targetRule: 'any',
      targetHeight: 'both'
    }
  },

  // 3. SIEGE RAM (Building Only)
  "vessel_siege": {
    id: "vessel_siege",
    name: "Siege Ram",
    type: "VESSEL",
    cost: 5,
    stats: {
      hp: 800, damage: 50, range: 1.0, sightRange: 7.0, speed: 3.0, attackSpeed: 1,
      deployTime: 2.0, aimTime: 0.5,

      // KHUSUS SIEGE: HANYA BANGUNAN
      movementType: 'ground',
      targetTeam: 'enemy',
      targetRule: 'building_only', // <--- PENTING
      targetHeight: 'ground'
    }
  },

  // 4. HEALER (Ally Only)
  "vessel_healer": {
    id: "vessel_healer",
    name: "Cleric",
    type: "VESSEL",
    cost: 4,
    stats: {
      hp: 100, 
      damage: -20, // Negative damage = Heal
      range: 4.0, sightRange: 6.0, speed: 4.5, attackSpeed: 1.2,
      deployTime: 1.0, aimTime: 0.5,

      // KHUSUS HEALER: TARGET TEMAN
      movementType: 'ground', // atau 'flying' jika ingin terbang
      targetTeam: 'ally',     // <--- PENTING (Biar gak heal musuh)
      targetRule: 'unit_only',
      targetHeight: 'both'
    }
  },
  "vessel_swarm": {
    id: "vessel_swarm",
    name: "Skeleton Horde",
    type: "VESSEL",
    cost: 3,
    stats: {
      count: 5,           // <--- ISI 5 UNIT
      spawnRadius: 1.5,   // <--- SEBARAN SPAWN
      hp: 40, damage: 10, range: 0.5, sightRange: 5.0, speed: 4.5, attackSpeed: 1.0,
      deployTime: 1.0, aimTime: 0.1,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground'
    },
    description: "Spawns a horde of 5 weak skeletons to overwhelm enemies."
  },

  // [NEW] MELEE AOE (Contoh: Valkyrie)
  "vessel_valkyrie": {
    id: "vessel_valkyrie",
    name: "War Maiden",
    type: "VESSEL",
    cost: 4,
    stats: {
      hp: 900, damage: 70, range: 1.0, sightRange: 5.5, speed: 3.5, attackSpeed: 0.6,
      deployTime: 1.5, aimTime: 0.3,
      
      // AOE CONFIG
      aoeRadius: 2.0,     // <--- Radius Putaran
      aoeType: 'self',    // 'self' (Muter di badan sendiri) atau 'target' (Cleave depan)
      
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground'
    },
    description: "Deals area damage around itself with each attack."
  },

  // [NEW] RANGED AOE (Contoh: Bomber/Wizard)
  "vessel_bomber": {
    id: "vessel_bomber",
    name: "Pyromancer",
    type: "VESSEL",
    cost: 5,
    stats: {
      hp: 300, damage: 100, range: 5.0, sightRange: 7.0, speed: 3.5, attackSpeed: 0.6,
      deployTime: 1.0, aimTime: 0.5,
      
      // AOE CONFIG
      aoeRadius: 1.5,     // <--- Radius Ledakan Bola Api
      projectileType: 'fireball', // Visual
      
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'both'
    },
    description: "Launches fireballs that explode on impact, dealing area damage."
  },
  
  // 5. RITUAL CONTOH
  "ritual_01": {
    id: "ritual_01",
    name: "Solar Flare",
    type: "RITUAL",
    cost: 3,
    spellData: {
      type: "damage_aoe",
      damage: 100,
      radius: 2.5,
      delay: 0.5
    },
    description: "Deals massive damage in a small area."
  },
  
};