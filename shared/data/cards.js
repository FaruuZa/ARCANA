export const CARDS = {
  "vessel_01": {
    id: "vessel_01",
    name: "Iron Vessel",
    type: "unit",
    cost: 3,
    stats: {
      hp: 150,
      damage: 10,
      range: 1,       // Jarak Serang (Melee)
      sightRange: 5.5,  // Jarak Pandang (Lebih jauh dari range)
      speed: 4.0,
      attackSpeed: 1.0,
      deployTime: 0.5   // Cepat ganti stance (Melee biasanya sigap)
    }
  },
  "vessel_02": {
    id: "vessel_02",
    name: "Ranger",
    type: "unit",
    cost: 4,
    stats: {
      hp: 60,
      damage: 15,
      range: 4.5,       // Jarak Serang (Jauh)
      sightRange: 6.5,  // Jarak Pandang
      speed: 5.0,
      attackSpeed: 0.8,
      deployTime: 1.0   // Lama ganti stance (Harus "ngokang" panah dulu)
    }
  }
};