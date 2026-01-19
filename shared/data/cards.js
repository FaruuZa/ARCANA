export const CARDS = {
  "vessel_01": {
    id: "vessel_01",
    name: "Iron Vessel", // Melee, Murah, Tanky
    type: "unit",
    cost: 3,
    stats: {
      hp: 150,       // Buff dikit biar jadi Tank
      damage: 10,
      range: 1.5,    // Melee
      speed: 4.0,    // Agak lambat
      attackSpeed: 1.0
    }
  },
  "vessel_02": {
    id: "vessel_02",
    name: "Ranger", // Ranged, Empuk, DPS
    type: "unit",
    cost: 4,
    stats: {
      hp: 60,        // Darah tipis
      damage: 15,    // Sakit
      range: 4.5,    // Tembak jauh
      speed: 5.0,    // Standar
      attackSpeed: 0.8 // Nembak cepat
    }
  }
};