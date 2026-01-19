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
      hp: 60, damage: 30, range: 4.5, sightRange: 6.5, speed: 5.0, attackSpeed: 0.8,
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
      hp: 800, damage: 50, range: 1.0, sightRange: 7.0, speed: 3.0, attackSpeed: 1.5,
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
  }
};