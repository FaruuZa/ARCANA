import { selection } from "../state/selection.js";
import { CARDS } from "../../shared/data/cards.js";
import { gameState, myTeamId as getMyTeamId } from "../state/gameState.js";
import { unitToScreen } from "../utils/grid.js";
import { GRID, RIVER_ROW_END, RIVER_ROW_START } from "../../shared/constants.js";
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
    if (!_grid) return;
    if (typeof _grid.cellSize !== 'number' || _grid.cellSize <= 0 || !Number.isFinite(_grid.cellSize)) return;

    // Reset visibility defaults
    if (forbiddenOverlay) forbiddenOverlay.visible = false;

    // 1. Cek Selection & myTeamId
    const myTeamId = gameState.getMyTeam();
    if (!selection.cardId || selection.index === -1 || myTeamId === -1) {
        ghostContainer.visible = false;
        return;
    }

    const cardData = CARDS[selection.cardId];
    if (!cardData) {
        // [DEBUG]
        ghostContainer.visible = false;
        return;
    }

    // Validasi Type
    if ((cardData.type === 'VESSEL' || cardData.type === 'SANCTUM') && !cardData.stats) return;
    if (cardData.type === 'RITUAL' && !cardData.spellData) return;

    // 3. Logic Validasi Placement
    const myPlayer = gameState.players[myTeamId];
    const canAfford = myPlayer && myPlayer.arcana >= cardData.cost;

    let isPlacementValid = true;

    // Cek Batas Grid
    if (currentMousePos.col < 0 || currentMousePos.col >= GRID.cols ||
        currentMousePos.row < 0 || currentMousePos.row >= GRID.rows) {
        isPlacementValid = false;
    }
    // Jika row invalid dari pointer.js (-1)
    if (currentMousePos.col === -1 || currentMousePos.row === -1) {
        isPlacementValid = false;
    }

    // 4. Update Posisi Ghost
    const screenPos = unitToScreen(currentMousePos, _grid);
    if (!screenPos || !Number.isFinite(screenPos.x) || !Number.isFinite(screenPos.y)) {
        ghostContainer.visible = false;
        return;
    }

    // --> Ghost Rendered HERE <---
    ghostContainer.x = screenPos.x;
    ghostContainer.y = screenPos.y;
    ghostContainer.visible = true;

    // 5. Update Texture (Procedural)
    if (cardData.type === 'VESSEL' || cardData.type === 'SANCTUM') {
        const myTeamId = gameState.getMyTeam();
        let factionName = 'solaris';
        if (gameState.players && gameState.players[myTeamId]) {
            factionName = gameState.players[myTeamId].faction || (myTeamId === 0 ? 'solaris' : 'noctis');
        }
        const texture = getUnitTexture(_app, selection.cardId, factionName);
        if (texture) {
            ghostSprite.texture = texture;
            ghostSprite.visible = true;
        } else {
            ghostSprite.visible = true;
        }

        // === DRAW OVERLAY HANYA JIKA GHOST VISIBLE ===
        if (forbiddenOverlay && myPlayer) {
            forbiddenOverlay.clear();
            forbiddenOverlay.visible = true;
            forbiddenOverlay.beginFill(0xFF0000, 0.3);

            const cellSize = _grid.cellSize;
            const renderRows = GRID.rows;
            let forbiddenHeightInRows = 0;

            if (myTeamId === 0) {
                // Team 0
                forbiddenHeightInRows = renderRows - RIVER_ROW_START;
            } else {
                // Team 1
                forbiddenHeightInRows = renderRows - ((renderRows - 1) - RIVER_ROW_END);
            }

            let forbiddenPixelHeight = forbiddenHeightInRows * cellSize;

            // [FIX] Kurangi 1px untuk Team 1 agar tidak bocor ke area playable
            if (myTeamId === 1) {
                forbiddenPixelHeight -= 1;
            }

            forbiddenOverlay.drawRect(
                _grid.offsetX,
                _grid.offsetY,
                _grid.boardWidth,
                forbiddenPixelHeight
            );

            forbiddenOverlay.endFill();
        }

    } else if (cardData.type === 'RITUAL') {
        ghostSprite.visible = false;
        // RITUAL tidak perlu overlay merah besar (biasanya target area saja)
    }

    // 6. Update Scale
    if ((cardData.type === 'VESSEL' || cardData.type === 'SANCTUM') && cardData.stats) {
        const stats = cardData.stats || {};
        const unitRadius = Number(stats.radius) || 0.4;

        const targetPixelSize = (unitRadius * 2) * _grid.cellSize;
        const baseTextureSize = 40;

        let scaleVal = targetPixelSize / baseTextureSize;
        if (!Number.isFinite(scaleVal) || scaleVal <= 0) scaleVal = 1;

        ghostSprite.scale.set(scaleVal);
    }

    // 7. Tinting
    if (cardData.type === 'VESSEL' || cardData.type === 'SANCTUM') {
        if (!isPlacementValid) {
            ghostSprite.tint = 0xFF0000;
        } else if (!canAfford) {
            ghostSprite.tint = 0xFFA500;
        } else {
            ghostSprite.tint = 0xFFFFFF;
        }
    }

    // 8. GAMBAR INDIKATOR (LINGKARAN) - Radius, Spell, etc.
    while (ghostContainer.children.length > 1) {
        ghostContainer.removeChildAt(1);
    }

    const g = new PIXI.Graphics();
    const safeDrawCircle = (radiusVal, color, alpha, isLine = false) => {
        if (typeof radiusVal !== 'number') return false;
        if (!Number.isFinite(radiusVal)) return false;
        if (radiusVal <= 1) return false;
        if (radiusVal > 5000) return false;
        if (radiusVal !== radiusVal) return false;

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

    if (typeof _grid.cellSize !== 'number' || _grid.cellSize <= 0 || !Number.isFinite(_grid.cellSize)) {
        ghostContainer.addChild(g);
        return;
    }

    const safeCellSize = _grid.cellSize;
    const stats = cardData.stats || {};

    // B. Spell Radius
    if (cardData.type === 'RITUAL' &&
        cardData.spellData &&
        typeof cardData.spellData.radius === 'number' &&
        Number.isFinite(cardData.spellData.radius) &&
        cardData.spellData.radius > 0) {

        const isTargetValid = isPlacementValid;
        const rangeColor = isTargetValid ? (canAfford ? 0x00FFFF : 0xFFA500) : 0xFF0000;

        const spellPx = cardData.spellData.radius * safeCellSize;
        safeDrawCircle(spellPx, rangeColor, 0.2, true);
    }

    // D. Spawn Radius
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