import { selection } from "../state/selection.js";
import { CARDS } from "../../shared/data/cards.js";
import { gameState, myTeamId as getMyTeamId } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";
import { GRID, RIVER_ROW_END } from "../../shared/constants.js";
import { getUnitTexture } from "./visuals/generator.js"; 

let _app, _grid;
let ghostContainer;
let ghostSprite;
let currentMousePos = { col: -1, row: -1 }; 
let validOverlay;

export function initGhost(app, grid) {
    _app = app;
    _grid = grid;

    // 1. SETUP OVERLAY (KABUT MERAH)
    validOverlay = new PIXI.Graphics();
    validOverlay.zIndex = 5; 
    validOverlay.visible = false;
    
    // Pastikan grid & constants aman
    const safeCellSize = grid.cellSize || 40; 
    const invalidRows = RIVER_ROW_END || 15;
    
    const overlayHeight = invalidRows * safeCellSize;
    const overlayWidth = (GRID.cols || 18) * safeCellSize;

    validOverlay.beginFill(0xFF0000, 0.3); 
    validOverlay.drawRect(0, 0, overlayWidth, overlayHeight);
    validOverlay.endFill();

    validOverlay.lineStyle(2, 0xFF0000, 0.8);
    validOverlay.moveTo(0, overlayHeight);
    validOverlay.lineTo(overlayWidth, overlayHeight);
    
    validOverlay.x = grid.offsetX || 0;
    validOverlay.y = grid.offsetY || 0;

    app.stage.addChild(validOverlay);

    // 2. SETUP GHOST CONTAINER
    ghostContainer = new PIXI.Container();
    ghostContainer.zIndex = 999;
    ghostContainer.visible = false;
    
    ghostSprite = new PIXI.Sprite();
    ghostSprite.anchor.set(0.5);
    ghostSprite.alpha = 0.6;
    ghostContainer.addChild(ghostSprite);

    app.stage.addChild(ghostContainer);

    app.ticker.add(() => {
        updateGhostVisuals();
    });
}

export function updateGhostPosition(serverCol, serverRow) {
    currentMousePos = { col: serverCol, row: serverRow };
}

function updateGhostVisuals() {
    // 0. SAFETY CHECK - SANGAT KETAT
    // Jika grid belum siap atau tidak valid, jangan lanjutkan
    if (!_grid) return;
    if (typeof _grid.cellSize !== 'number' || _grid.cellSize <= 0 || !Number.isFinite(_grid.cellSize)) return;

    // 1. Cek Selection & myTeamId
    const myTeamId = gameState.getMyTeam();
    if (!selection.cardId || selection.index === -1 || myTeamId === -1) {
        ghostContainer.visible = false;
        if (validOverlay) validOverlay.visible = false; 
        return;
    }

    const cardData = CARDS[selection.cardId];
    if (!cardData) {
        // [DEBUG] Card belum ter-load atau typo ID
        console.warn(`[GHOST] Card not found: ${selection.cardId}`, { 
            cardsAvailable: Object.keys(CARDS).length,
            selectedId: selection.cardId,
            allCards: Object.keys(CARDS).slice(0, 5) // Log 5 pertama
        });
        ghostContainer.visible = false;
        return;
    }

    // Validasi: VESSEL punya stats, RITUAL punya spellData
    if (cardData.type === 'VESSEL' && !cardData.stats) {
        console.warn(`[GHOST] VESSEL missing stats: ${selection.cardId}`);
        return;
    }
    if (cardData.type === 'RITUAL' && !cardData.spellData) {
        console.warn(`[GHOST] RITUAL missing spellData: ${selection.cardId}`);
        return;
    }

    // 2. Visibility Overlay Merah (HANYA untuk VESSEL)
    if (validOverlay) {
        validOverlay.visible = (cardData.type === 'VESSEL');
    }

    // 3. Logic Validasi Placement
    const myPlayer = gameState.players[myTeamId];
    const canAfford = myPlayer && myPlayer.arcana >= cardData.cost;
    
    let isPlacementValid = true;
    
    // Cek Batas Grid
    if (currentMousePos.col < 0 || currentMousePos.col >= GRID.cols || 
        currentMousePos.row < 0 || currentMousePos.row >= GRID.rows) {
        isPlacementValid = false;
    } 
    // Untuk VESSEL: pointer.js sudah validasi territory (RIVER_ROW_END), percaya nilai itu
    // Jika row invalid, pointer.js akan pass -1,-1 ke updateGhostPosition

    // 4. Update Posisi Ghost
    const screenPos = unitToScreen(currentMousePos, _grid);
    if (!screenPos || !Number.isFinite(screenPos.x) || !Number.isFinite(screenPos.y)) return; 

    ghostContainer.x = screenPos.x;
    ghostContainer.y = screenPos.y;
    ghostContainer.visible = true;

    // 5. Update Texture (Procedural) - HANYA untuk VESSEL
    if (cardData.type === 'VESSEL') {
        const myTeamId = gameState.getMyTeam();
        let factionName = 'solaris';
        if (gameState.players && gameState.players[myTeamId]) {
            factionName = gameState.players[myTeamId].faction || (myTeamId === 0 ? 'solaris' : 'noctis');
        }
        const texture = getUnitTexture(_app, selection.cardId, factionName);
        if (texture) {
            ghostSprite.texture = texture;
            ghostSprite.visible = true;  // ← RESTORE visibility untuk VESSEL!
        } else {
            console.warn(`No texture generated for ${selection.cardId}`);
            ghostSprite.visible = true;  // Tetap tampil meski no texture
        }
    } else if (cardData.type === 'RITUAL') {
        // RITUAL tidak perlu sprite texture, hanya lingkaran indikator
        ghostSprite.visible = false;
    }

    // 6. Update Scale (HANYA untuk VESSEL)
    if (cardData.type === 'VESSEL' && cardData.stats) {
        const stats = cardData.stats || {};
        const unitRadius = Number(stats.radius) || 0.4; // Force Number
        
        const targetPixelSize = (unitRadius * 2) * _grid.cellSize;
        const baseTextureSize = 40; 
        
        // Cegah scale Infinity/NaN
        let scaleVal = targetPixelSize / baseTextureSize;
        if (!Number.isFinite(scaleVal) || scaleVal <= 0) scaleVal = 1;
        
        ghostSprite.scale.set(scaleVal);
    }

    // 7. Tinting (HANYA untuk VESSEL)
    if (cardData.type === 'VESSEL') {
        if (!isPlacementValid) {
            ghostSprite.tint = 0xFF0000; 
        } else if (!canAfford) {
            ghostSprite.tint = 0xFFA500; 
        } else {
            ghostSprite.tint = 0xFFFFFF; 
        }
    }

    // 8. GAMBAR INDIKATOR (LINGKARAN)
    // Hapus indikator lama (Child selain sprite utama di index 0)
    while (ghostContainer.children.length > 1) {
        ghostContainer.removeChildAt(1);
    }

    const g = new PIXI.Graphics();
    
    // === HELPER AMAN UNTUK GAMBAR LINGKARAN ===
    const safeDrawCircle = (radiusVal, color, alpha, isLine = false) => {
        // VALIDASI SANGAT KETAT
        if (typeof radiusVal !== 'number') return false;
        if (!Number.isFinite(radiusVal)) return false;  // Reject Infinity, -Infinity, NaN
        if (radiusVal <= 1) return false;               // Reject sangat kecil (min 1px)
        if (radiusVal > 5000) return false;             // Reject sangat besar
        if (radiusVal !== radiusVal) return false;      // Extra check untuk NaN
        
        try {
            if (isLine) {
                g.lineStyle(2, color, 0.5);
                g.beginFill(color, 0.05);
            } else {
                g.lineStyle(0);
                g.beginFill(color, alpha);
            }
            
            g.drawCircle(0, 0, radiusVal);
            g.endFill();
            return true;
        } catch (e) {
            return false;
        }
    };

    // [SAFETY] Validasi cellSize sekali lagi
    if (typeof _grid.cellSize !== 'number' || _grid.cellSize <= 0 || !Number.isFinite(_grid.cellSize)) {
        ghostContainer.addChild(g);
        return;
    }

    const safeCellSize = _grid.cellSize;
    const stats = cardData.stats || {};

    // A. Range Circle - HANYA jika VESSEL dan range valid
    if (cardData.type === 'VESSEL' && 
        typeof stats.range === 'number' && 
        Number.isFinite(stats.range) && 
        stats.range > 2.0) {
        const rangeColor = isPlacementValid ? 0xFFFFFF : 0xFF0000;
        const rangePx = stats.range * safeCellSize;
        safeDrawCircle(rangePx, rangeColor, 0.1, true);
    }
    
    // B. Spell Radius - HANYA jika RITUAL dan spellData.radius valid
    if (cardData.type === 'RITUAL' && 
        cardData.spellData && 
        typeof cardData.spellData.radius === 'number' && 
        Number.isFinite(cardData.spellData.radius) && 
        cardData.spellData.radius > 0) {
        const spellPx = cardData.spellData.radius * safeCellSize;
        safeDrawCircle(spellPx, 0xFFA500, 0.2, true);
    }

    // C. AOE Radius - HANYA jika VESSEL dan valid
    if (cardData.type === 'VESSEL' &&
        typeof stats.aoeRadius === 'number' && 
        Number.isFinite(stats.aoeRadius) && 
        stats.aoeRadius > 0) {
        const aoePx = stats.aoeRadius * safeCellSize;
        safeDrawCircle(aoePx, 0xFF0000, 0.2, false);
    }

    // D. Spawn Radius - HANYA jika VESSEL swarm valid
    if (cardData.type === 'VESSEL' &&
        typeof stats.count === 'number' && 
        Number.isFinite(stats.count) && 
        stats.count > 1 && 
        typeof stats.spawnRadius === 'number' && 
        Number.isFinite(stats.spawnRadius) && 
        stats.spawnRadius > 0) {
        const spawnPx = stats.spawnRadius * safeCellSize;
        safeDrawCircle(spawnPx, 0x00FFFF, 0.1, true);
    }
    
    ghostContainer.addChild(g);
}