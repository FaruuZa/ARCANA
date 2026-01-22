// client/state/selection.js

export const selection = {
  cardId: null, // ID Kartu (misal: "vessel_01")
  index: -1,     // Posisi di tangan (0-3) untuk membedakan kartu kembar
  pendingTargetId: null // [NEW] Target untuk Single Target Spell
};

export function selectCard(id, index) {
  // Toggle: Jika klik kartu yang sama, deselect
  if (selection.index === index) {
    selection.cardId = null;
    selection.index = -1;
  } else {
    selection.cardId = id;
    selection.index = index;
  }
}

export function clearSelection() {
  selection.cardId = null;
  selection.index = -1;
  selection.pendingTargetId = null;
}