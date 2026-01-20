import { BRIDGE_COLUMNS } from "../../shared/constants.js";
import { SOLARIS_THEME } from "./themes/solaris.js";
import { NOCTIS_THEME } from "./themes/noctis.js";
import { gameState, myTeamId } from "../state/gameState.js"; // Import State & ID

let boardGraphics = null;
let lastDrawnTeam = -999; // ID Tim terakhir yang dirender (biar tidak redraw tiap tick)

export function initBoard(app, grid) {
  // 1. Buat Container Graphics Sekali Saja
  boardGraphics = new PIXI.Graphics();
  app.stage.addChild(boardGraphics);
  app.stage.setChildIndex(boardGraphics, 0); // Pastikan selalu di layer paling bawah

  // 2. Subscribe ke GameState
  // Kita cek setiap update: Apakah identitas tim saya berubah?
  gameState.subscribe(() => {
    if (myTeamId !== lastDrawnTeam) {
      drawBoard(grid); // Gambar ulang board
      lastDrawnTeam = myTeamId;
    }
  });

  // 3. Gambar awal (Default / Spectator View)
  drawBoard(grid);
}

function drawBoard(grid) {
  if (!boardGraphics) return;

  const g = boardGraphics;
  g.clear(); // Hapus gambar lama agar bersih

  const midY = grid.offsetY + (grid.boardHeight / 2);

  // --- LOGIC TEMA DINAMIS ---
  // Default (Team 0 / Spectator): Bawah = Solaris (Terang), Atas = Noctis (Gelap)
  let bottomTheme = SOLARIS_THEME;
  let topTheme = NOCTIS_THEME;

  // Jika saya Team 1 (Noctis), tukar posisi!
  // Karena board diputar (Base saya di Bawah), maka Bawah harus tema SAYA (Noctis)
  if (myTeamId === 1) {
    bottomTheme = NOCTIS_THEME;
    topTheme = SOLARIS_THEME;
  }

  

  // 1. ZONA ATAS VISUAL (Musuh)
  g.beginFill(topTheme.board.background);
  g.drawRect(grid.offsetX, grid.offsetY, grid.boardWidth, grid.boardHeight / 2);
  g.endFill();

  // 2. ZONA BAWAH VISUAL (Kita)
  g.beginFill(bottomTheme.board.background);
  g.drawRect(grid.offsetX, midY, grid.boardWidth, grid.boardHeight / 2);
  g.endFill();

  // 3. SUNGAI (Selalu di tengah)
  // Tinggi sungai 2 grid, berpusat di tengah board
  const riverHeight = 2 * grid.cellSize;
  const riverY = midY - grid.cellSize; 

  g.beginFill(0x111111, 0.3);
  g.drawRect(grid.offsetX, riverY, grid.boardWidth, riverHeight);
  g.endFill();

  // 4. JEMBATAN
  // Posisi jembatan (Col 2 dan 16) simetris kiri-kanan.
  // Jadi walaupun board diputar horizontal, posisi pixel jembatan tetap sama.
  g.beginFill(0x666666); 
  
  BRIDGE_COLUMNS.forEach(colIndex => {
    const centerX = grid.offsetX + (colIndex * grid.cellSize) + (grid.cellSize / 2);
    const bridgeWidth = grid.cellSize * 3;
    
    g.drawRect(
      centerX - (bridgeWidth / 2),
      riverY,
      bridgeWidth,
      riverHeight
    );
  });
  g.endFill();

  // 5. GRID LINES & BORDER
  g.lineStyle(1, 0xffffff, 0.1);
  for (let c = 0; c <= grid.cols; c++) {
    const x = grid.offsetX + c * grid.cellSize;
    g.moveTo(x, grid.offsetY); g.lineTo(x, grid.offsetY + grid.boardHeight);
  }
  for (let r = 0; r <= grid.rows; r++) {
    const y = grid.offsetY + r * grid.cellSize;
    g.moveTo(grid.offsetX, y); g.lineTo(grid.offsetX + grid.boardWidth, y);
  }
  
  // Border Luar
  g.lineStyle(2, 0x000000, 1);
  g.drawRect(grid.offsetX, grid.offsetY, grid.boardWidth, grid.boardHeight);
}