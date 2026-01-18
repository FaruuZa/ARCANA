import { LANE_COLUMNS, RIVER_ROW_START, RIVER_ROW_END, GRID, BRIDGE_COLUMNS} from "../../shared/constants.js";
import { SOLARIS_THEME } from "./themes/solaris.js";
import { NOCTIS_THEME } from "./themes/noctis.js";

export function initBoard(app, grid) {
  const g = new PIXI.Graphics();

  // 1. ZONA ATAS (NOCTIS / ENEMY)
  // Dari Row 0 sampai Tengah
  const midY = grid.offsetY + (grid.boardHeight / 2);
  
  g.beginFill(0x000000, 0.8);
  g.drawRect(
    0, 
    0,
    app.screen.width,
    app.screen.height
  )
  
  g.beginFill(NOCTIS_THEME.board.background);
  g.drawRect(
    grid.offsetX, 
    grid.offsetY, 
    grid.boardWidth, 
    grid.boardHeight / 2
  );
  g.endFill();

  // 2. ZONA BAWAH (SOLARIS / PLAYER)
  // Dari Tengah sampai Bawah
  g.beginFill(SOLARIS_THEME.board.background);
  g.drawRect(
    grid.offsetX, 
    midY, 
    grid.boardWidth, 
    grid.boardHeight / 2
  );
  g.endFill();

  // 3. SUNGAI (RIVER)
  // Menggunakan Row 7 & 8
  const riverY = grid.offsetY + (RIVER_ROW_START * grid.cellSize);
  const riverHeight = (RIVER_ROW_END - RIVER_ROW_START) * grid.cellSize;

  g.beginFill(0x000000, 0.5); // Bayangan sungai umum
  g.drawRect(
    grid.offsetX,
    riverY,
    grid.boardWidth,
    riverHeight
  );
  g.endFill();

  // 4. JEMBATAN (BRIDGES)
  g.beginFill(0x666666); 
  
  BRIDGE_COLUMNS.forEach(colIndex => {
    // Titik tengah jembatan (sesuai kolom lane)
    const centerX = grid.offsetX + (colIndex * grid.cellSize) + (grid.cellSize / 2);
    
    // Lebar total = 3 grid cell
    const bridgeWidth = grid.cellSize * 3;
    
    // Gambar Rect centered secara horizontal di kolom tersebut
    g.drawRect(
      centerX - (bridgeWidth / 2),
      riverY,
      bridgeWidth,
      riverHeight
    );
  });
  g.endFill();

  // 5. GRID LINES (OVERLAY)
  // Kita bedakan warna grid atas dan bawah agar tematik
  g.lineStyle(1, 0xffffff, 0.1); // Default tipis
  
  // Vertical lines
  for (let c = 0; c <= grid.cols; c++) {
    const x = grid.offsetX + c * grid.cellSize;
    g.moveTo(x, grid.offsetY);
    g.lineTo(x, grid.offsetY + grid.boardHeight);
  }

  // Horizontal lines
  for (let r = 0; r <= grid.rows; r++) {
    const y = grid.offsetY + r * grid.cellSize;
    g.moveTo(grid.offsetX, y);
    g.lineTo(grid.offsetX + grid.boardWidth, y);
  }

  // Border Board
  g.lineStyle(2, 0x000000, 1);
  g.drawRect(grid.offsetX, grid.offsetY, grid.boardWidth, grid.boardHeight);

  app.stage.addChild(g);
  
  // Posisikan di paling belakang (z-index simulation)
  app.stage.setChildIndex(g, 0); 
}