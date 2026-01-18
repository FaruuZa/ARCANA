// server/utils/math.js

export function distance(a, b) {
  // a dan b harus punya properti row & col
  const dRow = a.row - b.row;
  const dCol = a.col - b.col;
  
  // Rumus Pythagoras
  return Math.sqrt(dRow * dRow + dCol * dCol);
}

// Opsional: Jarak Manhattan (jika game lebih kaku kotak-kotak)
// Tapi untuk range serangan lingkaran, Euclidean (sqrt) lebih baik.