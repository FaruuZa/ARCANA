import { selection } from "../state/selection.js";
import { CARDS } from "../../shared/data/cards.js";
import { gameState, myTeamId as getMyTeamId } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";
import { GRID, RIVER_ROW_END } from "../../shared/constants.js";
import { getUnitTexture } from "./visuals/generator.js"; 

let _app, _grid;
let ghostContainer;
let ghostSprite;
let forbiddenOverlay; // [NEW] Overlay Graphics
let currentMousePos = { col: -1, row: -1 }; 

export function initGhost(app, grid) {
    _app = app;
    _grid = grid;

    // 1. SETUP OVERLAY REMOVED (User Request)

    // 2. SETUP GHOST CONTAINER
    ghostContainer = new PIXI.Container();
    ghostContainer.zIndex = 999;
    ghostContainer.visible = false;
    
    ghostSprite = new PIXI.Sprite();
    ghostSprite.anchor.set(0.5);
    ghostSprite.alpha = 0.6;
    ghostContainer.addChild(ghostSprite);

    // [NEW] Forbidden Overlay (Static on Stage)
    forbiddenOverlay = new PIXI.Graphics();
    forbiddenOverlay.zIndex = 900; // Below ghost (999)
    forbiddenOverlay.visible = false;
    app.stage.addChild(forbiddenOverlay);

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
        return;
    }

    const cardData = CARDS[selection.cardId];
    if (!cardData) {
        // [DEBUG] Card belum ter-load atau typo ID
        console.warn(`[GHOST] Card not found: ${selection.cardId}`);
        ghostContainer.visible = false;
        return;
    }

    // Validasi: VESSEL/SANCTUM punya stats, RITUAL punya spellData
    if ((cardData.type === 'VESSEL' || cardData.type === 'SANCTUM') && !cardData.stats) {
        // console.warn(`[GHOST] VESSEL missing stats: ${selection.cardId}`);
        return;
    }
    if (cardData.type === 'RITUAL' && !cardData.spellData) {
        // console.warn(`[GHOST] RITUAL missing spellData: ${selection.cardId}`);
        return;
    }

    // 2. Visibility Overlay Merah RESTORED (Forbidden Zones)
    if (forbiddenOverlay) {
        forbiddenOverlay.clear();
        forbiddenOverlay.visible = false;

        const myPlayer = gameState.players[myTeamId];
        // Only show for VESSELS/SANCTUMS that respect territory
        if ((cardData.type === 'VESSEL' || cardData.type === 'SANCTUM') && myPlayer) {
            forbiddenOverlay.visible = true;
            forbiddenOverlay.beginFill(0xFF0000, 0.3); // Red transparent

            const cellSize = _grid.cellSize;
            const cols = GRID.cols;
            const rows = GRID.rows;
            // Rows are 0 to rows-1.
            
            // Logic:
            // Team 0 (Bottom): Can place in rows >= rows - RIVER_ROW_END?
            // Wait, usually Team 0 is Bottom (Row ~60), Team 1 is Top (Row ~0).
            // Let's assume standard:
            // Team 0 spawns at Bottom. Valid: Row > (rows - RIVER_ROW_END)?
            // Or usually RIVER_ROW_END defines the " river" boundary from the "start" side.
            // Let's look at logic in pointer.js or existing validation.
            // Actually, usually:
            // Team 0 (Bottom): Valid Rows [Rows - Split, Rows]
            // Forbidden: [0, Rows - Split)
            
            // If we don't know exact logic, let's assume Split is roughly half or derived from RIVER_ROW_END.
            // Constants says RIVER_ROW_END.
            // If RIVER_ROW_END is e.g. 28 (Grid 64).
            // Team 0 (Bottom) valid: Rows [64-28=36 to 63].
            // Forbidden: [0 to 35].
            
            // Team 1 (Top) valid: Rows [0 to 27].
            // Forbidden: [28 to 63].
            
            const limit = RIVER_ROW_END || 25; // Fallback
            
            if (myTeamId === 0) {
                // I am Bottom. Forbidden is Top.
                // Draw Rect from (0,0) to (cols, rows - limit).
                const forbiddenHeight = (rows - limit) * cellSize;
                forbiddenOverlay.drawRect(0, 0, cols * cellSize, forbiddenHeight);
            } else {
                // I am Top. Forbidden is Bottom.
                // Draw Rect from (0, limit) to (cols, rows).
                const startY = limit * cellSize;
                forbiddenOverlay.drawRect(0, startY, cols * cellSize, (rows - limit) * cellSize);
            }
            
            forbiddenOverlay.endFill();
        }
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
    if (currentMousePos.col === -1 || currentMousePos.row === -1) {
        isPlacementValid = false;
    }

    // 4. Update Posisi Ghost
    const screenPos = unitToScreen(currentMousePos, _grid);
    if (!screenPos || !Number.isFinite(screenPos.x) || !Number.isFinite(screenPos.y)) return; 
    
    // Default visible unless placement invalid AND pointer outside?
    // Actually we want ghost always visible under mouse if dragging? 
    // Logic: if mouse is on canvas, show ghost.
    // Placement validity determines COLOR.
    
    ghostContainer.x = screenPos.x;
    ghostContainer.y = screenPos.y;
    ghostContainer.visible = true; 

    // 5. Update Texture (Procedural) - HANYA untuk VESSEL/SANCTUM
    if (cardData.type === 'VESSEL' || cardData.type === 'SANCTUM') {
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
            // console.warn(`No texture generated for ${selection.cardId}`);
            ghostSprite.visible = true;  // Tetap tampil meski no texture
        }
    } else if (cardData.type === 'RITUAL') {
        // RITUAL tidak perlu sprite texture, hanya lingkaran indikator
        ghostSprite.visible = false;
    }

    // 6. Update Scale (HANYA untuk VESSEL/SANCTUM)
    if ((cardData.type === 'VESSEL' || cardData.type === 'SANCTUM') && cardData.stats) {
        const stats = cardData.stats || {};
        const unitRadius = Number(stats.radius) || 0.4; // Force Number
        
        const targetPixelSize = (unitRadius * 2) * _grid.cellSize;
        const baseTextureSize = 40; 
        
        // Cegah scale Infinity/NaN
        let scaleVal = targetPixelSize / baseTextureSize;
        if (!Number.isFinite(scaleVal) || scaleVal <= 0) scaleVal = 1;
        
        ghostSprite.scale.set(scaleVal);
    }

    // 7. Tinting (HANYA untuk VESSEL/SANCTUM)
    if (cardData.type === 'VESSEL' || cardData.type === 'SANCTUM') {
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

    // B. Spell Radius - HANYA jika RITUAL dan spellData.radius valid
    if (cardData.type === 'RITUAL' && 
        cardData.spellData && 
        typeof cardData.spellData.radius === 'number' && 
        Number.isFinite(cardData.spellData.radius) && 
        cardData.spellData.radius > 0) {
        
        const isTargetValid = isPlacementValid; // If inside grid
        const rangeColor = isTargetValid ? (canAfford ? 0x00FFFF : 0xFFA500) : 0xFF0000;
        
        const spellPx = cardData.spellData.radius * safeCellSize;
        safeDrawCircle(spellPx, rangeColor, 0.2, true);
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