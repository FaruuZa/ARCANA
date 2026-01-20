export const BLUEPRINTS = {
  // --- SOLARIS FACTION (Light, Order) ---
  'vessel_hammer': {
    body: 'armor_heavy',
    head: 'helmet_viking',
    weapon: 'hammer',
    scale: 1.1
  },
  
  'vessel_frost_archer': {
    body: 'robe',
    head: 'hood',
    weapon: 'bow',
    scale: 0.9
  },

  'vessel_cavalry': {
    body: 'armor_heavy',
    head: 'helmet_viking',
    weapon: 'sword',
    scale: 1.2
  },

  'vessel_healer': {
    body: 'ethereal',
    head: 'halo',
    weapon: 'staff',
    scale: 0.85
  },

  'vessel_priest': {
    body: 'robe',
    head: 'crown_gold',
    weapon: 'staff',
    scale: 1.0
  },

  'vessel_knight': {
    body: 'armor_heavy',
    head: 'helmet_viking',
    weapon: 'sword',
    scale: 1.15
  },

  // --- NOCTIS FACTION (Darkness, Chaos) ---
  'vessel_assassin': {
    body: 'spikes',
    head: 'mask_void',
    weapon: 'dagger',
    scale: 0.95
  },

  'vessel_silencer': {
    body: 'frame_shadow',
    head: 'mask_void',
    weapon: 'dagger',
    scale: 0.88
  },

  'vessel_reaper': {
    body: 'spikes',
    head: 'crown_shadow',
    weapon: 'scythe',
    scale: 1.05
  },

  'vessel_shadow_mage': {
    body: 'ethereal',
    head: 'hood',
    weapon: 'staff',
    scale: 0.9
  },

  'vessel_dark_knight': {
    body: 'armor_heavy',
    head: 'helmet_shadow',
    weapon: 'axe',
    scale: 1.1
  },

  'vessel_shadow_archer': {
    body: 'frame_shadow',
    head: 'mask_void',
    weapon: 'bow',
    scale: 0.92
  },

  // --- GENERIC / FALLBACKS ---
  'vessel_soldier': {
    body: 'default',
    head: 'default', 
    weapon: 'sword',
    scale: 0.8
  },

  'tower_king': {
    body: 'armor_heavy',
    head: 'crown_gold',
    weapon: 'none',
    scale: 1.5
  },

  // Fallback untuk kartu yang belum didefinisikan
  'default': {
    body: 'default',
    head: 'default',
    weapon: 'none',
    scale: 1.0
  }
};