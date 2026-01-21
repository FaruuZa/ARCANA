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
      hp: 60, damage: 30, range: 4.5, sightRange: 6.5, speed: 5.0, attackSpeed: 1.5,
      deployTime: 1.0, aimTime: 0.8, count: 2, spawnRadius: 1,
      
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
      damage: -70, // Negative damage = Heal
      range: 4.0, sightRange: 6.0, speed: 4.5, attackSpeed: 0.8,
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
      spawnRadius: 2,   // <--- SEBARAN SPAWN
      hp: 40, damage: 10, range: 1, sightRange: 5.0, speed: 4.5, attackSpeed: 1.0,
      deployTime: 1.0, aimTime: 0.1,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground'
    },
    description: "Spawns a horde of 5 weak skeletons to overwhelm enemies."
  },

  // [NEW] MELEE AOE 
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

  // [NEW] RANGED AOE 
  "vessel_bomber": {
    id: "vessel_bomber",
    name: "Pyromancer",
    type: "VESSEL",
    cost: 5,
    stats: {
      hp: 150, damage: 100, range: 5.0, sightRange: 7.0, speed: 3.5, attackSpeed: 0.6,
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

  "vessel_cavalry": {
    id: "vessel_cavalry",
    name: "Heavy Cavalry",
    type: "VESSEL",
    cost: 5,
    stats: {
      hp: 600, damage: 80, range: 1.5, sightRange: 6.0, speed: 4.0, attackSpeed: 1.2,
      deployTime: 1.0, aimTime: 0.5,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground',
      
      // TRAITS BARU
      traits: {
        mounted: true,      // Bisa lewati sungai
        charge: {
           enabled: true,
           windupTime: 2.0, // Harus lari 2 detik baru aktif
           speedMult: 2.0,  // Speed jadi 2x lipat saat charge
           damageMult: 2.0  // Damage 2x lipat saat nabrak
        }
      }
    }
  },

  // 2. ASSASSIN (Jump)
  "vessel_assassin": {
    id: "vessel_assassin",
    name: "Shadow Assassin",
    type: "VESSEL",
    cost: 4,
    stats: {
      hp: 100, damage: 100, range: 1.0, sightRange: 7.0, speed: 5.0, attackSpeed: 0.8,
      deployTime: 1.0, aimTime: 0.2,
      movementType: 'ground',
      
      traits: {
        jump: {
           enabled: true,
           range: 10.0,      // Jarak lompat max
           minRange: 4,   // Gak lompat kalau musuh dekat
           cooldown: 8.0,   // Tiap 8 detik bisa lompat
           speed: 30.0,     // Kecepatan terbang saat lompat
           aoeRadius: 1.5,  // Dampak area saat mendarat
           damage: 200,       // Damage pendaratan (opsional)
           windup: 1,         // Diam 0.5 detik sebelum lompat
           priority: 'farthest' // Prioritas target lompat
        }
      }
    }
  },

  "vessel_healer_2": {  
    id: "vessel_healer_2",
    name: "Divine Priest",
    type: "VESSEL",
    cost: 4,
    stats:{
      hp: 70,
      damage: -100, // Negative damage = Heal
      range: 2.0,
      sightRange: 6.5,
      speed: 4.0,
      attackSpeed: 1.0,
      deployTime: 1.0,
      aimTime: 0.5,
      movementType: 'ground',
      targetTeam: 'ally',
      targetRule: 'unit_only',
      targetHeight: 'both',

      aoeRadius: 2.0,     // <--- Radius Putaran
      aoeType: 'self', 
    }
  },
  "vessel_frost_archer": {
    id: "vessel_frost_archer",
    name: "Frost Archer",
    type: "VESSEL",
    cost: 4,
    stats: {
      hp: 120, damage: 10, range: 5.0, sightRange: 7.0, speed: 4.0, attackSpeed: 1.1,
      deployTime: 1.0, aimTime: 0.3,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'both',
      projectileType: 'arrow_ice', // Pastikan aset visual ada, atau fallback ke arrow
      
      traits: {
        freezeOnHit: true // <--- Flag untuk Logic Attack
      }
    },
    description: "Attacks slow enemy movement and attack speed."
  },

  // CONTOH 2: HAMMER DWARF (Stun Effect)
  "vessel_hammer": {
    id: "vessel_hammer",
    name: "Storm Hammer",
    type: "VESSEL",
    cost: 5,
    stats: {
      hp: 800, damage: 10, range: 1.0, sightRange: 5.0, speed: 3.0, attackSpeed: 0.7,
      deployTime: 1.5, aimTime: 0.4,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'ground',
      
      traits: {
        stunOnHit: true,    // <--- Flag Stun
        stunDuration: 1.0   // Durasi stun
      }
    },
    description: "Heavy attacks have a chance to stun enemies."
  },

  // CONTOH 3: WAR CRY (Buff Ritual)
  "ritual_warcry": {
    id: "ritual_warcry",
    name: "War Cry",
    type: "RITUAL",
    cost: 3,
    spellData: {
      type: "buff_area",      
      radius: 3.5,
      targetTeam: 'ally',   // Target TEMAN
      buffs: [
        { type: 'speed_mult', value: 1.5, duration: 5.0 },       // Lari 1.5x
        { type: 'attack_speed_mult', value: 1.4, duration: 5.0 } // Serang 1.4x
      ]
    },
    description: "Enrages nearby allies, increasing movement and attack speed."
  },

  "ritual_root": {
    id: "ritual_root",
    name: "Nature's Grasp",
    type: "RITUAL",
    cost: 3,
    spellData: {
      type: "buff_area",    // Kita pakai sistem buff_area yang sudah dibuat
      radius: 3.0,
      targetTeam: 'enemy',  // Target MUSUH
      buffs: [
        { type: 'root', value: 1, duration: 4.0 } // ROOT selama 4 detik
      ]
    },
    description: "ROOTS all enemies in an area for 4s. They cannot move."
  },

  // Mekanisme: Serangan memberi debuff Silence, mencegah musuh pakai skill (lompat/charge).
  "vessel_silencer": {
    id: "vessel_silencer",
    name: "Witch Hunter",
    type: "VESSEL",
    cost: 4,
    stats: {
      hp: 350, damage: 45, range: 5.5, sightRange: 7.0, speed: 4.5, attackSpeed: 1.1,
      deployTime: 1.0, aimTime: 0.2,
      movementType: 'ground',
      targetTeam: 'enemy', targetRule: 'any', targetHeight: 'both',
      projectileType: 'arrow_purple', // Asumsi ada visual ini

      traits: {
        silenceOnHit: true,     // <--- Logic Silence
        silenceDuration: 3.0    // Silence 3 detik
      }
    },
    description: "Attacks SILENCE enemies, preventing ability usage."
  },

  "ritual_gigantify": {
    id: "ritual_gigantify",
    name: "Titan's Growth",
    type: "RITUAL",
    cost: 4,
    spellData: {
      type: "buff_area",
      radius: 3.0,
      targetTeam: 'ally',
      buffs: [
        { 
            type: 'scale_mult', 
            value: 1.5,      // Jadi 1.5x lebih besar
            duration: 8.0 
        },
        { 
            type: 'damage_mult', 
            value: 1.5,      // Damage juga naik
            duration: 8.0 
        },
        {
            type: 'speed_mult', // Opsional: Jadi lambat karena berat
            value: 0.8,
            duration: 8.0
        }
      ]
    },
    description: "Make allies GIANT! Increases size and damage by 50%."
},

  // 1. CONTOH AURA: "Paladin"
  // Memberi armor/heal ke teman di sekitar
  "vessel_paladin": {
    id: "vessel_paladin",
    name: "Paladin",
    type: "VESSEL",
    cost: 5,
    stats: {
      hp: 1000, damage: 80, range: 1.0, speed: 2.5,
      traits: {
        aura: {
          radius: 3.5,
          targetTeam: 'ally',
          buffs: [
            { type: 'regen', value: 5 } // Heal 5 HP per tick (kuat!)
          ]
        }
      }
    }
  },

  // 2. CONTOH ON-DEATH: "Giant Skeleton"
  // Mati meninggalkan bom besar
  "vessel_giant_skeleton": {
    id: "vessel_giant_skeleton",
    name: "Giant Skeleton",
    type: "VESSEL",
    cost: 6,
    stats: {
      hp: 2000, damage: 100, range: 1.0, speed: 2.0, radius: 0.6,
      traits: {
        onDeath: {
          type: 'damage_aoe',
          radius: 2.5,
          damage: 1000 // Massive Damage!
        }
      }
    }
  },

  // 3. CONTOH ON-SPAWN: "Electro Wizard" (Masuk langsung Zap)
  "vessel_electro": {
    id: "vessel_electro",
    name: "Electro Mage",
    type: "VESSEL",
    cost: 4,
    stats: {
      hp: 600, damage: 90, range: 4.0, speed: 3.0,
      traits: {
        onSpawn: {
          type: 'damage_aoe',
          radius: 2.0,
          damage: 150,
          buffs: [{ type: 'stun', duration: 0.5 }] // Stun saat mendarat
        }
      }
    }
  },

  // 4. CONTOH SPAWN ON DEATH: "Golem"
  "vessel_golem": {
    id: "vessel_golem",
    name: "Golem",
    type: "VESSEL",
    cost: 8,
    stats: {
      hp: 3000, damage: 100, speed: 1, radius: 1, range:2, targetRule:'building_only',
      traits: {
        onDeath: {
          type: 'spawn',
          unitId: 'vessel_golemite', // Pastikan kartu ini ada (walau hidden)
          count: 2
        }
      }
    }
  },

  "vessel_golemite":{
    id: "vessel_golemite",
    name: "Golemite",
    type: "VESSEL",
    cost: 0,
    stats:{
      hp: 150, damage: 50, range:1.5, radius: 0.5, speed:2.0, targetRule:'building_only',
      traits:{
        onDeath:{
          type: 'damage_aoe',
          radius: 1.5,
          damage: 200 
        }
      }
    }
  }

  

  
};