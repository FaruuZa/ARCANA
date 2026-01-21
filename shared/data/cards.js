export const CARDS = {
  // 1. VESSEL BIASA (Neutral)
  "vessel_01": {
    id: "vessel_01",
    name: "Iron Vessel",
    type: "VESSEL",
    minFaction: "neutral", // [NEW] Neutral
    cost: 3,
    stats: {
      hp: 150, damage: 20, range: 1.5, sightRange: 5.5, speed: 4.0, attackSpeed: 1.0,
      deployTime: 1.0, aimTime: 0.1,
      movementType: 'ground',
      targetTeam: 'enemy',
      targetRule: 'any',
      targetHeight: 'both'
    }
  },
  
  // 2. RANGER (Solaris)
  "vessel_02": {
    id: "vessel_02",
    name: "Sun Ranger",
    type: "VESSEL",
    minFaction: "solaris", // [NEW] Solaris
    cost: 4,
    stats: {
      hp: 60, damage: 30, range: 4.5, sightRange: 6.5, speed: 5.0, attackSpeed: 1.5,
      deployTime: 1.0, aimTime: 0.8, count: 2, spawnRadius: 1,
      movementType: 'ground',
      targetTeam: 'enemy',
      targetRule: 'any',
      targetHeight: 'both'
    }
  },

  // 3. SIEGE RAM (Noctis)
  "vessel_siege": {
    id: "vessel_siege",
    name: "Dark Ram",
    type: "VESSEL",
    minFaction: "noctis", // [NEW] Noctis
    cost: 5,
    stats: {
      hp: 800, damage: 50, range: 1.0, sightRange: 7.0, speed: 3.0, attackSpeed: 1,
      deployTime: 2.0, aimTime: 0.5,
      movementType: 'ground',
      targetTeam: 'enemy',
      targetRule: 'building_only', 
      targetHeight: 'ground'
    }
  },

  // 4. HEALER (Solaris)
  "vessel_healer": {
    id: "vessel_healer",
    name: "Cleric",
    type: "VESSEL",
    minFaction: "solaris",
    cost: 4,
    stats: {
      hp: 100, 
      damage: -70, 
      range: 4.0, sightRange: 6.0, speed: 4.5, attackSpeed: 0.8,
      deployTime: 1.0, aimTime: 0.5,
      movementType: 'ground', 
      targetTeam: 'ally',    
      targetRule: 'unit_only',
      targetHeight: 'both'
    }
  },

  // 5. HORDE (Noctis)
  "vessel_swarm": {
    id: "vessel_swarm",
    name: "Skeleton Horde",
    type: "VESSEL",
    minFaction: "noctis",
    cost: 3,
    stats: {
      count: 5,           
      spawnRadius: 2,   
      hp: 40, damage: 10, range: 1, sightRange: 5.0, speed: 4.5, attackSpeed: 1.0,
      deployTime: 1.0, aimTime: 0.1,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground'
    },
    description: "Spawns a horde of 5 weak skeletons."
  },

  // VALKYRIE (Neutral)
  "vessel_valkyrie": {
    id: "vessel_valkyrie",
    name: "War Maiden",
    type: "VESSEL",
    minFaction: "neutral",
    cost: 4,
    stats: {
      hp: 900, damage: 70, range: 1.0, sightRange: 5.5, speed: 3.5, attackSpeed: 0.6,
      deployTime: 1.5, aimTime: 0.3,
      aoeRadius: 2.0,     
      aoeType: 'self',    
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground'
    },
    description: "Deals area damage around itself."
  },

  // BOMBER (Noctis)
  "vessel_bomber": {
    id: "vessel_bomber",
    name: "Pyromancer",
    type: "VESSEL",
    minFaction: "noctis",
    cost: 5,
    stats: {
      hp: 150, damage: 100, range: 5.0, sightRange: 7.0, speed: 3.5, attackSpeed: 0.6,
      deployTime: 1.0, aimTime: 0.5,
      aoeRadius: 1.5,    
      projectileType: 'fireball', 
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'both'
    }
  },
  
  // SPELL (Solaris)
  "ritual_01": {
    id: "ritual_01",
    name: "Solar Flare",
    type: "RITUAL",
    minFaction: "solaris",
    cost: 3,
    spellData: {
      type: "damage_aoe",
      damage: 100,
      radius: 2.5,
      delay: 0.5
    }
  },

  // CAVALRY (Neutral)
  "vessel_cavalry": {
    id: "vessel_cavalry",
    name: "Heavy Cavalry",
    type: "VESSEL",
    minFaction: "neutral",
    cost: 5,
    stats: {
      hp: 600, damage: 80, range: 1.5, sightRange: 6.0, speed: 4.0, attackSpeed: 1.2,
      deployTime: 1.0, aimTime: 0.5,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground',
      traits: {
        mounted: true,      
        charge: { enabled: true, windupTime: 2.0, speedMult: 2.0, damageMult: 2.0 }
      }
    }
  },

  // ASSASSIN (Noctis)
  "vessel_assassin": {
    id: "vessel_assassin",
    name: "Shadow Assassin",
    type: "VESSEL",
    minFaction: "noctis",
    cost: 4,
    stats: {
      hp: 100, damage: 100, range: 1.0, sightRange: 7.0, speed: 5.0, attackSpeed: 0.8,
      deployTime: 1.0, aimTime: 0.2,
      movementType: 'ground',
      traits: {
        jump: { enabled: true, range: 10.0, minRange: 4, cooldown: 8.0, speed: 30.0, aoeRadius: 1.5, damage: 200, windup: 1, priority: 'farthest' }
      }
    }
  },

  // HEALER 2 (Solaris)
  "vessel_healer_2": {  
    id: "vessel_healer_2",
    name: "Divine Priest",
    type: "VESSEL",
    minFaction: "solaris",
    cost: 4,
    stats:{
      hp: 70, damage: -100, range: 2.0, sightRange: 6.5, speed: 4.0, attackSpeed: 1.0,
      deployTime: 1.0, aimTime: 0.5,
      movementType: 'ground',
      targetTeam: 'ally', targetRule: 'unit_only', targetHeight: 'both',
      aoeRadius: 2.0, aoeType: 'self', 
    }
  },

  // FROST ARCHER (Neutral)
  "vessel_frost_archer": {
    id: "vessel_frost_archer",
    name: "Frost Archer",
    type: "VESSEL",
    minFaction: "neutral",
    cost: 4,
    stats: {
      hp: 120, damage: 10, range: 5.0, sightRange: 7.0, speed: 4.0, attackSpeed: 1.1,
      deployTime: 1.0, aimTime: 0.3,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'both',
      projectileType: 'arrow_ice',
      traits: { freezeOnHit: true }
    }
  },

  // HAMMER (Neutral)
  "vessel_hammer": {
    id: "vessel_hammer",
    name: "Storm Hammer",
    type: "VESSEL",
    minFaction: "neutral",
    cost: 5,
    stats: {
      hp: 800, damage: 10, range: 1.0, sightRange: 5.0, speed: 3.0, attackSpeed: 0.7,
      deployTime: 1.5, aimTime: 0.4,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground',
      traits: { stunOnHit: true, stunDuration: 1.0 }
    }
  },

  // WARCRY (Solaris)
  "ritual_warcry": {
    id: "ritual_warcry",
    name: "War Cry",
    type: "RITUAL",
    minFaction: "solaris",
    cost: 3,
    spellData: {
      type: "buff_area",      
      radius: 3.5,
      targetTeam: 'ally',
      buffs: [
        { type: 'speed_mult', value: 1.5, duration: 5.0 },
        { type: 'attack_speed_mult', value: 1.4, duration: 5.0 }
      ]
    }
  },

  // ROOT (Neutral)
  "ritual_root": {
    id: "ritual_root",
    name: "Nature's Grasp",
    type: "RITUAL",
    minFaction: "neutral",
    cost: 3,
    spellData: {
      type: "buff_area", radius: 3.0, targetTeam: 'enemy',
      buffs: [ { type: 'root', value: 1, duration: 4.0 } ]
    }
  },

  // SILENCER (Noctis) - Witch Hunter sounds Noctis
  "vessel_silencer": {
    id: "vessel_silencer",
    name: "Witch Hunter",
    type: "VESSEL",
    minFaction: "noctis",
    cost: 4,
    stats: {
      hp: 350, damage: 45, range: 5.5, sightRange: 7.0, speed: 4.5, attackSpeed: 1.1,
      deployTime: 1.0, aimTime: 0.2,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'both',
      projectileType: 'arrow_purple', 
      traits: { silenceOnHit: true, silenceDuration: 3.0 }
    }
  },

  // GIGANTIFY (Solaris)
  "ritual_gigantify": {
    id: "ritual_gigantify",
    name: "Titan's Growth",
    type: "RITUAL",
    minFaction: "solaris",
    cost: 4,
    spellData: {
      type: "buff_area", radius: 3.0, targetTeam: 'ally',
      buffs: [
        { type: 'scale_mult', value: 1.5, duration: 8.0 },
        { type: 'damage_mult', value: 1.5, duration: 8.0 },
        { type: 'speed_mult', value: 0.8, duration: 8.0 }
      ]
    }
  },

  // PALADIN (Solaris)
  "vessel_paladin": {
    id: "vessel_paladin",
    name: "Paladin",
    type: "VESSEL",
    minFaction: "solaris",
    cost: 5,
    stats: {
      hp: 1000, damage: 80, range: 1.0, speed: 2.5,
      traits: { aura: { radius: 3.5, targetTeam: 'ally', buffs: [{ type: 'regen', value: 5 }] } }
    }
  },

  // GIANT SKELETON (Noctis Taboo?)
  "vessel_giant_skeleton": {
    id: "vessel_giant_skeleton",
    name: "Giant Skeleton",
    type: "VESSEL",
    minFaction: "neutral",
    isTaboo: true, // [NEW] TABOO
    cost: 6,
    stats: {
      hp: 2000, damage: 100, range: 1.0, speed: 2.0, radius: 0.6,
      traits: { onDeath: { type: 'damage_aoe', radius: 2.5, damage: 1000 } }
    }
  },

  // 3. CONTOH ON-SPAWN: "Electro Wizard" (Masuk langsung Zap)
  "vessel_electro": {
    id: "vessel_electro",
    name: "Electro Mage",
    type: "VESSEL",
    minFaction: "solaris",
    cost: 4,
    stats: {
      hp: 600, damage: 90, range: 4.0, speed: 3.0,
      traits: { onSpawn: { type: 'damage_aoe', radius: 2.0, damage: 150, buffs: [{ type: 'stun', duration: 0.5 }] } }
    }
  },

  // GOLEM (Neutral)
  "vessel_golem": {
    id: "vessel_golem",
    name: "Golem",
    type: "VESSEL",
    minFaction: "neutral",
    cost: 8,
    stats: {
      hp: 3000, damage: 100, speed: 1, radius: 1, range:2, targetRule:'building_only',
      traits: { onDeath: { type: 'spawn', unitId: 'vessel_golemite', count: 2 } }
    }
  },
  
  // HIDDEN (Tokens)
  "vessel_golemite":{
    id: "vessel_golemite", name: "Golemite", type: "VESSEL", minFaction: "neutral", cost: 0, isToken:true,
    stats:{ hp: 150, damage: 50, range:1.5, radius: 0.5, speed:2.0, targetRule:'building_only', traits:{ onDeath:{ type: 'damage_aoe', radius: 1.5, damage: 200 } } }
  },

  // POISON (Noctis)
  "ritual_poison": {
    id: "ritual_poison",
    name: "Toxic Cloud",
    type: "RITUAL",
    minFaction: "noctis",
    cost: 4,
    spellData: {
      type: "zone_lingering", radius: 3.5, duration: 5.0, interval: 0.5, damage: 40, targetTeam: 'enemy',
      buffs: [ { type: 'speed_mult', value: 0.7, duration: 1.0 } ]
    }
  },

  // HEAL WARD (Solaris)
  "ritual_heal_ward": {
    id: "ritual_heal_ward",
    name: "Healing Ward",
    type: "RITUAL",
    minFaction: "solaris",
    cost: 3,
    spellData: {
      type: "zone_lingering", radius: 3.0, duration: 6.0, interval: 1.0, damage: 0, targetTeam: 'ally',
      buffs: [ { type: 'regen', value: 50, duration: 0.2 } ]
    }
  }
};