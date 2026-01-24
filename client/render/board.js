import { BRIDGE_COLUMNS } from "../../shared/constants.js";
import { SOLARIS_THEME } from "./themes/solaris.js";
import { NOCTIS_THEME } from "./themes/noctis.js";
import { gameState, myTeamId } from "../state/gameState.js"; // Import State & ID

let boardContainer = null;
let envGraphics = null;
let boardGraphics = null;
let lastDrawnTeam = -999; 

export function initBoard(app, grid) {
  // Container utama
  boardContainer = new PIXI.Container();
  app.stage.addChild(boardContainer);
  app.stage.setChildIndex(boardContainer, 0); // Background layer

  // 1. Environment Graphics (Latar Belakang Layar Penuh)
  envGraphics = new PIXI.Graphics();
  boardContainer.addChild(envGraphics);

  // 2. Board Graphics (Playable Area)
  boardGraphics = new PIXI.Graphics();
  boardContainer.addChild(boardGraphics);

  // Subscribe ke GameState
  // Kita cek setiap update: Apakah identitas tim saya berubah ATAU Faksi berubah?
  // Ini penting agar board tidak "stuck" di tema default (Solaris) jika data faksi telat masuk.
  let lastSignature = "";

  gameState.subscribe(() => {
    // Generate signature state (TeamID + Faction0 + Faction1)
    const p0 = gameState.players[0];
    const p1 = gameState.players[1];
    
    // Safety check
    const f0 = p0 ? p0.faction : "loading";
    const f1 = p1 ? p1.faction : "loading";
    
    const currentSignature = `${myTeamId}:${f0}:${f1}`;
    
    // Jika ada yang berubah (termasuk kita baru login, atau faksi lawan terungkap), redraw!
    if (currentSignature !== lastSignature) {
      drawFullBoard(app, grid);
      lastSignature = currentSignature;
    }
  });

  // Gambar awal
  drawFullBoard(app, grid);

  // Return API
  return {
    resize: () => drawFullBoard(app, grid)
  };
}

function drawFullBoard(app, grid) {
  if (!envGraphics || !boardGraphics) return;

  const currentTeam = myTeamId === -999 ? 0 : myTeamId; // Default to Solaris logic if indeterminate
  const isSpectator = myTeamId === -999;
  
  // --- LOGIC TEMA DINAMIS ---
  // Default (Fallback): Team 0 = Solaris, Team 1 = Noctis
  // Tapi kita cek data asli dari gameState.players jika ada
  
  const p0 = gameState.players[0];
  const p1 = gameState.players[1];

  const faction0 = p0 ? p0.faction : 'solaris';
  const faction1 = p1 ? p1.faction : 'noctis';

  const themeMap = {
      'solaris': SOLARIS_THEME,
      'noctis': NOCTIS_THEME
  };

  // Tentukan tema asli masing-masing tim
  const team0Theme = themeMap[faction0] || SOLARIS_THEME;
  const team1Theme = themeMap[faction1] || NOCTIS_THEME;

  let bottomTheme = team0Theme;
  let topTheme = team1Theme;

  // Jika saya Team 1, tukar posisi (Saya selalu di bawah)
  if (currentTeam === 1) {
    bottomTheme = team1Theme;
    topTheme = team0Theme;
  }

  // --- 1. DRAW ENVIRONMENT (Background Layar) ---
  const gEnv = envGraphics;
  gEnv.clear();
  
  const screenW = app.screen.width;
  const screenH = app.screen.height;
  const midScreenY = screenH / 2;

  // Atas (Musuh)
  gEnv.beginFill(topTheme.board.environment);
  gEnv.drawRect(0, 0, screenW, midScreenY);
  gEnv.endFill();

  // Bawah (Kita)
  gEnv.beginFill(bottomTheme.board.environment);
  gEnv.drawRect(0, midScreenY, screenW, midScreenY);
  gEnv.endFill();

  // --- 2. DRAW BOARD (Playable Grid) ---
  const g = boardGraphics;
  g.clear();

  const boardY = grid.offsetY;
  const boardH = grid.boardHeight;
  const midBoardY = boardY + (boardH / 2);

  // Background Board (Sedikit lebih gelap/terang dari environment untuk kontras)
  // Atas
  g.beginFill(topTheme.board.background); 
  g.drawRect(grid.offsetX, grid.offsetY, grid.boardWidth, grid.boardHeight / 2);
  g.endFill();

  // Bawah
  g.beginFill(bottomTheme.board.background);
  g.drawRect(grid.offsetX, midBoardY, grid.boardWidth, grid.boardHeight / 2);
  g.endFill();

  // Floor Texture/Detail (Minimalis)
  // Solaris: Marble Grid effect?
  // Noctis: Subtle cracks? 
  // Kita buat simple overlay saja untuk sekarang
  
  // --- 3. SUNGAI (RIVER) - NEUTRAL GATEWAY ---
  const riverHeight = 2 * grid.cellSize;
  const riverY = midBoardY - grid.cellSize; 
  
  // Single Neutral River Color (Dark Grey/Void/Abyss representing the boundary)
  // Or maybe a glowing mystical stream?
  // Let's go with a deep neutral slate grey to separate the factions.
  const neutralRiverColor = 0x2c3e50; // Dark Slate Blue
  
  g.beginFill(neutralRiverColor);
  g.drawRect(grid.offsetX, riverY, grid.boardWidth, riverHeight);
  g.endFill();

  // --- 4. JEMBATAN (BRIDGES) - NEUTRAL GATEWAY ---
  // No outlines, unified structure.
  
  const bridgeColor = 0x95a5a6; // Concrete/Grey Stone
  
  BRIDGE_COLUMNS.forEach(colIndex => {
    const centerX = grid.offsetX + (colIndex * grid.cellSize) + (grid.cellSize / 2);
    const bridgeWidth = grid.cellSize * 2.8; 
    
    // Single Block Bridge
    g.beginFill(bridgeColor);
    g.drawRect(centerX - (bridgeWidth/2), riverY, bridgeWidth, riverHeight);
    g.endFill();
    
    // Optional: Subtle "Road" or "Path" texture/color in the middle to look like a walkway, 
    // but user asked for no outlines. Simple is better based on request.
  });

  // --- 5. GRID LINES (Minimalis) ---
  const lineAlpha = 0.05; // Sangat tipis/samar
  
  // Grid Atas
  g.lineStyle(1, topTheme.board.laneLine, lineAlpha);
  drawGridLines(g, grid.offsetX, grid.offsetY, grid.boardWidth, grid.boardHeight/2, grid.cellSize);
  
  // Grid Bawah
  g.lineStyle(1, bottomTheme.board.laneLine, lineAlpha);
  drawGridLines(g, grid.offsetX, midBoardY, grid.boardWidth, grid.boardHeight/2, grid.cellSize);

  // Border Luar Board (Tebal) - Revised to be Open in the Middle
  const borderThick = 4;
  
  // Atas (U-shape terbalik: Kiri - Atas - Kanan)
  g.lineStyle(borderThick, topTheme.board.laneLine, 0.8);
  // Kiri
  g.moveTo(grid.offsetX, grid.offsetY + grid.boardHeight/2);
  g.lineTo(grid.offsetX, grid.offsetY);
  // Atas
  g.lineTo(grid.offsetX + grid.boardWidth, grid.offsetY);
  // Kanan
  g.lineTo(grid.offsetX + grid.boardWidth, grid.offsetY + grid.boardHeight/2);

  // Bawah (U-shape: Kiri - Bawah - Kanan)
  g.lineStyle(borderThick, bottomTheme.board.laneLine, 0.8);
  // Kiri
  g.moveTo(grid.offsetX, midBoardY);
  g.lineTo(grid.offsetX, midBoardY + grid.boardHeight/2);
  // Bawah
  g.lineTo(grid.offsetX + grid.boardWidth, midBoardY + grid.boardHeight/2);
  // Kanan
  g.lineTo(grid.offsetX + grid.boardWidth, midBoardY);
}

function drawGridLines(g, x, y, w, h, size) {
  const cols = w / size;
  const rows = h / size;

  for (let c = 1; c < cols; c++) {
    const lx = x + c * size;
    g.moveTo(lx, y); g.lineTo(lx, y + h);
  }
  for (let r = 1; r < rows; r++) {
    const ly = y + r * size;
    g.moveTo(x, ly); g.lineTo(x + w, ly);
  }
}