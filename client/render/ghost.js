import { selection } from "../state/selection.js";
import { CARDS } from "../../shared/data/cards.js";
import { gameState, myTeamId } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";

let _app, _grid;
let ghostContainer;
let currentMousePos = { col: -1, row: -1 }; 

export function initGhost(app, grid) {
    _app = app;
    _grid = grid;

    ghostContainer = new PIXI.Container();
    ghostContainer.zIndex = 999; 
    ghostContainer.visible = false;
    app.stage.addChild(ghostContainer);

    app.ticker.add(() => {
        updateGhostVisuals();
    });
}

export function updateGhostPosition(serverCol, serverRow) {
    currentMousePos = { col: serverCol, row: serverRow };
}

function updateGhostVisuals() {
    // 1. Cek Selection
    if (!selection.cardId || selection.index === -1 || myTeamId === -1) {
        ghostContainer.visible = false;
        return;
    }

    const cardData = CARDS[selection.cardId];
    if (!cardData) return;

    // 2. Setup Container
    ghostContainer.visible = true;
    ghostContainer.removeChildren();

    // 3. Validasi Uang
    const myPlayer = gameState.players[myTeamId]; // Aman karena gameState.js sudah difix
    const canAfford = myPlayer && myPlayer.arcana >= cardData.cost;
    const baseColor = canAfford ? 0x00FF00 : 0xFF0000;
    const alpha = 0.5;

    // 4. Posisi
    const dummyPos = { col: currentMousePos.col, row: currentMousePos.row };
    const screenPos = unitToScreen(dummyPos, _grid);
    
    ghostContainer.x = screenPos.x;
    ghostContainer.y = screenPos.y;

    const g = new PIXI.Graphics();
    
    // === [FIX UTAMA: SAFE CHECK STATS] ===
    // Pastikan cardData.stats ada sebelum akses count/spawnRadius
    const stats = cardData.stats || {}; 

    // A. SWARM SPAWN RADIUS (Jika ada stats & count > 1)
    if (stats.count && stats.count > 1 && stats.spawnRadius) {
        g.lineStyle(2, 0x00FFFF, 0.5); 
        g.beginFill(0x00FFFF, 0.1);
        g.drawCircle(0, 0, stats.spawnRadius * _grid.cellSize);
        g.endFill();
    }

    // B. AOE / RITUAL RADIUS
    let radius = 0;
    if (cardData.type === 'RITUAL') {
        radius = cardData.spellData.radius;
    } else if (stats.aoeRadius) {
        radius = stats.aoeRadius;
    }

    if (radius > 0) {
        g.lineStyle(2, 0xFFA500, 0.8); 
        g.beginFill(0xFFA500, 0.2);
        g.drawCircle(0, 0, radius * _grid.cellSize);
        g.endFill();
    }

    // C. BODY GHOST (Unit / Spell Marker)
    g.beginFill(baseColor, alpha);
    g.drawCircle(0, 0, _grid.cellSize * 0.4);
    g.endFill();

    // D. SWARM PREVIEW (Titik-titik kecil)
    if (stats.count && stats.count > 1) {
        const count = stats.count;
        const r = stats.spawnRadius || 0.5;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = r * _grid.cellSize * 0.7; 
            const sx = Math.cos(angle) * dist;
            const sy = Math.sin(angle) * dist;
            
            g.beginFill(baseColor, 0.8);
            g.drawCircle(sx, sy, 4); 
            g.endFill();
        }
    }

    ghostContainer.addChild(g);

    // E. RANGE ATTACK
    if (stats.range && stats.range > 2.0 && cardData.type === 'VESSEL') {
        const rangeG = new PIXI.Graphics();
        rangeG.lineStyle(1, 0xFFFFFF, 0.3); 
        rangeG.drawCircle(0, 0, stats.range * _grid.cellSize);
        ghostContainer.addChild(rangeG);
    }

    // F. TEXT LABEL
    const style = new PIXI.TextStyle({
        fontFamily: 'Arial', fontSize: 14,
        fill: canAfford ? '#ffffff' : '#ffaaaa',
        stroke: '#000000', strokeThickness: 3, align: 'center',
    });
    const text = new PIXI.Text(cardData.name, style);
    text.anchor.set(0.5);
    text.y = -_grid.cellSize; 
    ghostContainer.addChild(text);
}