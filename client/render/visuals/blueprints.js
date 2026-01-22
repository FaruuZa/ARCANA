export const BLUEPRINTS = {
  // === NEUTRAL / COMMON ===
  'vessel_01': { body: 'armor_plate', head: 'helmet_full', weapon: 'sword', scale: 0.9 }, // Iron Vessel
  'vessel_hammer': { body: 'armor_heavy', head: 'helmet_viking', weapon: 'hammer', scale: 1.1 },
  'vessel_cavalry': { body: 'armor_heavy', head: 'helmet_full', weapon: 'lance', scale: 1.2 }, // Horse represented by size/armor
  'vessel_valkyrie': { body: 'armor_heavy', head: 'helmet_viking', weapon: 'axe_double', scale: 1.1 },
  'vessel_frost_archer': { body: 'robe', head: 'hood_ice', weapon: 'bow', scale: 0.9 },
  'vessel_golem': { body: 'rock', head: 'head_cyclops', weapon: 'fist_rock', scale: 1.4 },
  'vessel_golemite': { body: 'rock', head: 'head_cyclops', weapon: 'fist_rock', scale: 0.7 },
  'vessel_giant_skeleton': { body: 'ribs_armor', head: 'skull_helm', weapon: 'bomb_carry', scale: 1.5 },

  // === SOLARIS (Order/Light) ===
  'vessel_02': { body: 'robe_green', head: 'hood_ninja', weapon: 'bow', scale: 0.9 }, // Sun Ranger
  'vessel_healer': { body: 'robe', head: 'hood', weapon: 'staff', scale: 0.85 }, // Cleric
  'vessel_healer_2': { body: 'robe', head: 'crown_gold', weapon: 'staff', scale: 0.9 }, // Divine Priest
  'vessel_paladin': { body: 'armor_heavy', head: 'helmet_full', weapon: 'hammer', scale: 1.2 },
  'vessel_electro': { body: 'robe', head: 'mohawk', weapon: 'magic_zap', scale: 0.9 }, // Electro Mage

  // === NOCTIS (Chaos/Dark) ===
  'vessel_siege': { body: 'machine_tank', head: 'robot_horn', weapon: 'none', scale: 1.3 }, // Dark Ram
  'vessel_swarm': { body: 'ribs', head: 'skull', weapon: 'sword', scale: 0.8 }, // Skeletons
  'vessel_bomber': { body: 'robe_dark', head: 'mask_hood', weapon: 'bomb_drop', scale: 0.9 }, // Pyromancer
  'vessel_assassin': { body: 'frame_shadow', head: 'mask_void', weapon: 'dagger', scale: 0.9 },
  'vessel_silencer': { body: 'shirt_plaid', head: 'hat_wizard', weapon: 'musket', scale: 0.95 }, // Witch Hunter

  // === TOWERS ===
  'tower_king': { body: 'armor_heavy', head: 'crown_gold', weapon: 'none', scale: 1.5 },

  // === FALLBACK ===
  'default': { body: 'default', head: 'default', weapon: 'none', scale: 1.0 }
};