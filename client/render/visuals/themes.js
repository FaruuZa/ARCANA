/**
 * Palette warna untuk setiap faksi ARCANA
 * Sesuai dengan filosofi design di Design.txt
 */

export const FACTION_PALETTES = {
  // === ARCANA SOLARIS ===
  // Tema: Cahaya, keteraturan, takdir
  // Warna: Emas, putih, biru muda
  solaris: {
    primary: 0xFFD700,    // Emas cerah - warna utama faction
    secondary: 0x87CEEB,  // Biru muda - highlight & detail
    accent: 0xFFFFFF,     // Putih - glow, cahaya
    dark: 0xB8860B,       // Emas gelap - shadow
    detail: 0xB0BEC5      // Biru pucat - outline
  },

  // === ARCANA NOCTIS ===
  // Tema: Bayangan, chaos, kebebasan
  // Warna: Ungu, hitam, merah gelap
  noctis: {
    primary: 0x9C27B0,    // Ungu - warna utama faction
    secondary: 0xE040FB,  // Ungu neon/magenta - highlight
    accent: 0xFF1493,     // Pink terang - glow, energy
    dark: 0x4A2838,       // Merah gelap - shadow
    detail: 0x424242      // Abu gelap - outline
  },

  // === ARCANA MORTIS (UPCOMING) ===
  // Tema: Kematian, pengorbanan
  mortis: {
    primary: 0x696969,    // Abu-abu gelap
    secondary: 0x8B0000,  // Merah gelap - darah
    accent: 0xFFFFFF,     // Putih - bone, tulang
    dark: 0x2F4F4F,       // Abu sangat gelap
    detail: 0x556B2F      // Hijau gelap - busuk
  },

  // === ARCANA CHRONIS (UPCOMING) ===
  // Tema: Waktu, prediksi
  chronis: {
    primary: 0x20B2AA,    // Teal terang
    secondary: 0x00CED1,  // Cyan bright
    accent: 0xFFFFFF,     // Putih
    dark: 0x008B8B,       // Teal gelap
    detail: 0x191970      // Biru gelap
  }
};

/**
 * Dapatkan palette berdasarkan nama faksi
 * @param {string} factionName - 'solaris', 'noctis', 'mortis', 'chronis'
 * @returns {Object} Palette dengan primary, secondary, accent, dark, detail
 */
export function getFactionPalette(factionName) {
    return FACTION_PALETTES[factionName] || FACTION_PALETTES['solaris'];
}

/**
 * Helper untuk mendapatkan kontras yang baik
 * Untuk VESSEL Solaris: primary = emas
 * Untuk VESSEL Noctis: primary = ungu
 */
export function getColorForUnit(cardId, factionName) {
  const palette = getFactionPalette(factionName);
  
  // Jika unit assassin atau dark, gunakan secondary (lebih terang)
  if (cardId.includes('assassin') || cardId.includes('shadow') || cardId.includes('reaper')) {
    return palette.secondary;
  }
  
  return palette.primary;
}