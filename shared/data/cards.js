export const CARDS = {
  // 1. VESSEL BIASA (Neutral)
  // 1. NEUTRAL TANK
  "vessel_01": {
    id: "vessel_01",
    name: "Iron Vanguard",
    type: "VESSEL",
    minFaction: "neutral",
    cost: 3,
    stats: {
      hp: 550, damage: 45, range: 1.5, sightRange: 5.5, speed: 3.5, attackSpeed: 1.2,
      deployTime: 1.0, aimTime: 0.5,
      movementType: 'ground',
      targetTeam: 'enemy',
      targetRule: 'any',
      targetHeight: 'ground'
    },
    description: "A heavily armored soldier who holds the line against any tide."
  },
  
  // 2. SOLARIS RANGER
  "vessel_02": {
    id: "vessel_02",
    name: "Sun Ranger",
    type: "VESSEL",
    minFaction: "solaris",
    cost: 4,
    stats: {
      hp: 140, damage: 45, range: 5.0, sightRange: 7.0, speed: 5.0, attackSpeed: 1.3,
      deployTime: 1.0, aimTime: 0.6, count: 2, spawnRadius: 1,
      movementType: 'ground',
      targetTeam: 'enemy',
      targetRule: 'any',
      targetHeight: 'both',
      projectileType: 'arrow_solaris'
    },
    description: "Elite archers who rain piercing light upon the unworthy."
  },

  // 3. NOCTIS SIEGE
  "vessel_siege": {
    id: "vessel_siege",
    name: "Void Ram",
    type: "VESSEL",
    minFaction: "noctis",
    cost: 5,
    stats: {
      hp: 950, damage: 80, range: 1.0, sightRange: 7.0, speed: 3.0, attackSpeed: 1,
      deployTime: 2.0, aimTime: 0.5,
      movementType: 'ground',
      targetTeam: 'enemy',
      targetRule: 'building_only', 
      targetHeight: 'ground'
    },
    description: "A living siege engine forged from the abyss to shatter walls."
  },

  // 4. SOLARIS HEALER
  "vessel_healer": {
    id: "vessel_healer",
    name: "Lightbringer",
    type: "VESSEL",
    minFaction: "solaris",
    cost: 4,
    stats: {
      hp: 180, 
      damage: -80, 
      range: 4.5, sightRange: 6.5, speed: 4.0, attackSpeed: 0.8,
      deployTime: 1.0, aimTime: 0.4,
      movementType: 'ground', 
      targetTeam: 'ally',    
      targetRule: 'unit_only',
      targetHeight: 'both'
    },
    description: "Channels the sun's warmth to mend the wounds of the faithful."
  },

  // 5. NOCTIS SWARM
  "vessel_swarm": {
    id: "vessel_swarm",
    name: "Hollow Legion",
    type: "VESSEL",
    minFaction: "noctis",
    cost: 3,
    stats: {
      count: 5,           
      spawnRadius: 2,   
      hp: 65, damage: 15, range: 1, sightRange: 5.0, speed: 4.5, attackSpeed: 1.0,
      deployTime: 1.0, aimTime: 0.1,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground'
    },
    description: "A swarm of restless souls that overwhelms enemies by sheer number."
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

  // [NEW] SINGLE TARGET TEST: LIGHTNING BOLT
  "ritual_lightning": {
    id: "ritual_lightning",
    name: "Lightning Bolt",
    type: "RITUAL",
    minFaction: "solaris",
    cost: 4,
    spellData: {
        type: "single_target",
        damage: 600,
        targetTeam: 'enemy',
        buffs: [{ type: 'stun', duration: 1.0 }]
    },
    description: "Deals massive damage to a single unit and stuns it."
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
      type: "single_target", targetTeam: 'ally',
      buffs: [
        { type: 'scale_mult', value: 2, duration: 20.0 },
        { type: 'damage_mult', value: 2, duration: 20.0 },
        { type: 'speed_mult', value: 0.5, duration: 20.0 }
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
    isTaboo: true, // [NEW] Taboo Unit
    cost: 6,
    stats: {
      hp: 2000, damage: 100, range: 1.0, speed: 2.0, radius: 0.6,
      traits: { 
          // [NEW] Friendly Fire Spawn (Fall Damage?)
          onSpawn: { type: 'damage_aoe', radius: 2.5, damage: 150, targetTeam: 'all' },
          // [NEW] Friendly Fire Death (Big Bomb)
          onDeath: { type: 'damage_aoe', radius: 4.0, damage: 1000, delay: 2.0, targetTeam: 'all' } 
      }
    },
    description: "Massive unit that damages EVERYONE nearby when landing and dying."
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
  },

  // [NEW] FIREBALL (Standard AoE)
  "ritual_fireball": {
    id: "ritual_fireball", name: "Fireball", type: "RITUAL", minFaction: "neutral", cost: 3,
    spellData: { type: "damage_aoe", damage: 250, radius: 1.5, delay: 0.8 },
    description: "Deals moderate area damage."
  },

  // [NEW] FROST NOVA (AoE Stun/Freeze)
  "ritual_frost_nova": {
    id: "ritual_frost_nova", name: "Frost Nova", type: "RITUAL", minFaction: "neutral", cost: 4,
    spellData: { 
        type: "damage_aoe", damage: 50, radius: 2.5, delay: 0.2, // Fast pop
        buffs: [{ type: 'stun', duration: 2.0 }]
    },
    description: "Freezes enemies in a large area."
  },

  // [NEW] METEOR (High Dmg, Long Delay)
  "ritual_meteor": {
    id: "ritual_meteor", name: "Meteor", type: "RITUAL", minFaction: "noctis", cost: 6,
    spellData: { type: "damage_aoe", damage: 800, radius: 2.0, delay: 2.5 },
    description: "Deals massive damage after a significant delay."
  },

  // [NEW] DIVINE HEAL (Single Target)
  "ritual_heal_single": {
    id: "ritual_heal_single", name: "Holy Light", type: "RITUAL", minFaction: "solaris", cost: 3,
    spellData: { 
        type: "single_target", targetTeam: 'ally', 
        damage: -500, // Negative damage = Heal? Check spellSystem! If not, use buff regen.
        // Assuming damage subtraction logic handles negatives as heal or need explicit heal logic?
        // Let's use Buffs to be safe if 'damage' only does subtraction.
        // Actually, spellSystem: target.hp -= spell.damage. So -(-500) = +500. It works!
        buffs: [{ type: 'shield', value: 200, duration: 5.0 }]
    },
    description: "Heals a friendly unit for 500 HP and shields them."
  },

  // [NEW] BERSERK (Single Target Buff)
  "ritual_berserk": {
    id: "ritual_berserk", name: "Bloodlust", type: "RITUAL", minFaction: "noctis", cost: 3,
    spellData: { 
        type: "single_target", targetTeam: 'ally', 
        buffs: [
            { type: 'damage_mult', value: 2.0, duration: 8.0 },
            { type: 'attack_speed_mult', value: 2.0, duration: 8.0 },
            { type: 'speed_mult', value: 1.5, duration: 8.0 }
        ]
    },
    description: "Greatly boosts a unit's combat stats."
  },
  // [NEW] SILENCE (Single Target Debuff)
  "ritual_silence": {
    id: "ritual_silence", name: "Silence", type: "RITUAL", minFaction: "noctis", cost: 3,
    spellData: { 
        type: "single_target", targetTeam: 'enemy', 
        buffs: [
            { type: 'silence', duration: 5.0 }
        ]
    },
      description: "Silences a unit, preventing it from using abilities."
  },

  // === TABOO CARDS ===

  // [NEW] forbidden_pact (Ritual: Instant Mana, reduce Regen)
  "ritual_forbidden_pact": {
    id: "ritual_forbidden_pact",
    name: "Forbidden Pact",
    type: "RITUAL",
    minFaction: "noctis",
    isTaboo: true,
    demerit: { type: 'arcana_mult', value: 0.8 }, 
    cost: 0,
    spellData: {
        type: "gain_mana", value: 4 // Buffed to 4
    },
    description: "Seize power now, at the cost of your future. Instantly gain 4 Arcana, but permanently reduce regeneration."
  },

  // [NEW] traitor_knight (Unit: High Stats, Attacks ALL)
  "vessel_traitor": {
    id: "vessel_traitor",
    name: "Fallen Champion",
    type: "VESSEL",
    minFaction: "neutral",
    isTaboo: true,
    cost: 4, // Increased Cost
    stats: {
      hp: 1100, damage: 160, range: 1.5, sightRange: 6.0, speed: 4.0, attackSpeed: 0.8,
      deployTime: 1.0, aimTime: 0.4,
      movementType: 'ground',
      targetTeam: 'all', 
      targetRule: 'any', targetHeight: 'ground'
    },
    description: "A once-noble hero corrupted by the void. Strikes blindly at friend and foe alike."
  },
  // === SANCTUM (Buildings) ===
  
  "sanctum_tower": {
    id: "sanctum_tower",
    name: "Sentry Post",
    type: "SANCTUM", 
    minFaction: "neutral",
    cost: 4,
    stats: {
      hp: 1200, damage: 30, range: 6.0, sightRange: 7.0, speed: 0, attackSpeed: 1.0,
      deployTime: 5.0, 
      movementType: 'none',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'both',
      isBuilding: true,
      radius: 0.8
    },
    description: "A defensive structure that fires upon enemies."
  },

  "sanctum_wall": {
    id: "sanctum_wall",
    name: "Barricade",
    type: "SANCTUM",
    minFaction: "neutral",
    cost: 2,
    stats: {
      hp: 2000, damage: 0, range: 0, sightRange: 2.0, speed: 0, attackSpeed: 0,
      deployTime: 3.0,
      movementType: 'none',
      targetTeam: 'none',
      isBuilding: true,
      radius: 0.8
    },
    description: "A sturdy wall to block enemy pathing."
  },

  // === MORE TABOO CARDS ===

  "ritual_blood_sacrifice": {
    id: "ritual_blood_sacrifice",
    name: "Blood Sacrifice",
    type: "RITUAL",
    minFaction: "noctis",
    isTaboo: true,
    demerit: { type: 'hq_damage', value: 500 }, // Hurts own King Tower
    cost: 0,
    spellData: {
        type: "gain_mana", value: 3
    },
    description: "Sacrifice your King's health to gain immediate Arcana."
  },

  "sanctum_cursed_idol": {
    id: "sanctum_cursed_idol",
    name: "Cursed Idol",
    type: "SANCTUM",
    minFaction: "neutral",
    cost: 3,
    stats: {
      hp: 2500, damage: 0, range: 0, speed: 0,
      movementType: 'none',
      isBuilding: true,
      radius: 1.0, 
      traits: {
        aura: { radius: 3.0, targetTeam: 'all', damage: 20, interval: 1.0 } // Rots everyone nearby
      }
    },
    description: "A structure with immense durability that decays everything around it, including allies."
  },

  // === NEW FACTION UNITS ===

  // SOLARIS
  "vessel_sun_guardian": {
    id: "vessel_sun_guardian",
    name: "Sun Guardian",
    type: "VESSEL",
    minFaction: "solaris",
    cost: 6,
    stats: {
      hp: 1400, damage: 60, range: 1.5, speed: 2.5, attackSpeed: 1.0,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any',
      traits: {
          onHit: { chance: 0.3, type: 'blind', duration: 2.0 } // Blinds enemies
      }
    },
    description: "A heavily armored guardian whose shield reflects blinding light."
  },

  "vessel_dawn_breaker": {
    id: "vessel_dawn_breaker",
    name: "Dawn Breaker",
    type: "VESSEL",
    minFaction: "solaris",
    cost: 5,
    stats: {
      hp: 750, damage: 120, range: 1.5, speed: 3.5, attackSpeed: 1.4,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any',
      aoeRadius: 1.5 // Cleave attack
    },
    description: "Wields a massive hammer that strikes multiple enemies at once."
  },

  // NOCTIS
  "vessel_night_shade": {
    id: "vessel_night_shade",
    name: "Night Shade",
    type: "VESSEL",
    minFaction: "noctis",
    cost: 2,
    stats: {
      hp: 200, damage: 80, range: 1.0, speed: 6.0, attackSpeed: 0.6, // Very fast, glass cannon
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any'
    },
    description: "A swift assassin that strikes from the shadows."
  },

  "vessel_void_walker": {
    id: "vessel_void_walker",
    name: "Void Walker",
    type: "VESSEL",
    minFaction: "noctis",
    cost: 5,
    stats: {
      hp: 900, damage: 65, range: 1.5, speed: 3.0, attackSpeed: 1.0,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any',
      traits: {
        shield: { value: 300, regen: 0 } // Starts with a void shield
      }
    },
    description: "Protected by a dark barrier that absorbs damage."
  },
  // === MORE NEW CARDS ===

  "vessel_radiant_wisp": {
    id: "vessel_radiant_wisp",
    name: "Radiant Wisp",
    type: "VESSEL",
    minFaction: "solaris",
    cost: 3,
    stats: {
      hp: 200, damage: -40, range: 3.0, speed: 4.0, attackSpeed: 1.0,
      movementType: 'air', // Flying
      targetTeam: 'ally', targetRule: 'unit_only',
      aoeRadius: 2.0 // AoE Heal
    },
    description: "A flying spirit that heals nearby allies."
  },

  "vessel_void_ray": {
    id: "vessel_void_ray",
    name: "Void Ray",
    type: "VESSEL",
    minFaction: "noctis",
    cost: 5,
    stats: {
      hp: 550, damage: 20, range: 4.0, speed: 3.5, attackSpeed: 0.2, // Fast ticks
      movementType: 'air',
      targetTeam: 'enemy', targetRule: 'any',
      traits: { rampUp: { value: 5, max: 100 } } // Damage increases over time (needs logic support?)
    },
    description: "A flying construct that focuses a beam of void energy."
  },

  "ritual_earthquake": {
    id: "ritual_earthquake",
    name: "Earthquake",
    type: "RITUAL",
    minFaction: "neutral",
    cost: 4,
    spellData: {
        type: "damage_aoe", damage: 100, radius: 4.0, 
        targetTeam: 'enemy', targetRule: 'building_only', // Focus buildings
        buffs: [{ type: 'speed_mult', value: 0.3, duration: 3.0 }] // Slows units too logic dependent
    },
    description: "Shakes the ground, dealing damage to buildings and slowing units."
  },

  "ritual_shield_wall": {
    id: "ritual_shield_wall",
    name: "Aegis",
    type: "RITUAL",
    minFaction: "solaris",
    cost: 3,
    spellData: {
        type: "buff_area", radius: 3.0, targetTeam: 'ally',
        buffs: [{ type: 'shield', value: 300, duration: 6.0 }]
    },
    description: "Grants a temporary shield to all allies in the area."
  },

  "sanctum_spikes": {
    id: "sanctum_spikes",
    name: "Spike Trap",
    type: "SANCTUM",
    minFaction: "neutral",
    cost: 2,
    stats: {
      hp: 400, damage: 0, range: 0.5, speed: 0, movementType: 'none', isBuilding: true,
      radius: 0.6,
      traits: {
          aura: { radius: 1.0, targetTeam: 'enemy', damage: 50, interval: 0.5 }
      }
    },
    description: "Deals damage to enemies walking over it."
  },

  "ritual_soul_burn": {
    id: "ritual_soul_burn",
    name: "Soul Burn",
    type: "RITUAL",
    minFaction: "noctis",
    isTaboo: true,
    demerit: { type: 'hq_damage', value: 200 },
    cost: 2,
    spellData: {
        type: "damage_aoe", radius: 3.0, damage: 400, targetTeam: 'enemy'
    },
    description: "Deals high damage to enemies, but consumes some of your Essence."
  },

  "vessel_catapult": {
    id: "vessel_catapult",
    name: "Siege Catapult",
    type: "VESSEL",
    minFaction: "neutral",
    cost: 6,
    stats: {
      hp: 500, damage: 250, range: 9.0, minRange: 3.0, speed: 2.0, attackSpeed: 0.3,
      deployTime: 3.0, aimTime: 1.0,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'building_only',
      aoeRadius: 1.5, projectileType: 'rock'
    },
    description: "Long-range siege weapon effective against buildings."
  }

};