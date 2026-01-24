import { CARDS } from "../../shared/data/cards.js";
import { spawnUnit, spawnBuilding } from "../gameState.js";
import { castRitual } from "./spellSystem.js";
import { isValidPlacement, isValidBuildingPlacement } from "../rules/placement.js";
import { triggerTraitEffect } from "../utils/combat.js";

// Helper: Random Offset for Swarm
function getRandomOffset(radius) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * radius;
    return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist
    };
}

export function processCardCost(gameState, teamId, cardInfo, cardId) {
    const playerState = gameState.players[teamId];
    const cardIndex = playerState.hand.indexOf(cardId);
    if (cardIndex === -1) return false;

    if (playerState.arcana < cardInfo.cost) return false;

    // 1. Bayar
    playerState.arcana -= cardInfo.cost;

    // 2. GANTI KARTU
    if (playerState.deck.length > 0) {
        const randomReplacement = playerState.deck[Math.floor(Math.random() * playerState.deck.length)];
        playerState.hand[cardIndex] = randomReplacement;
    }

    playerState.next = playerState.deck[Math.floor(Math.random() * playerState.deck.length)];

    // [NEW] Process Taboo Demerit
    if (cardInfo.isTaboo && cardInfo.demerit) {
        processDemerit(gameState, teamId, playerState, cardInfo.demerit);
    }

    return true;
}

// [NEW] Helper: Taboo Demerit Logic
function processDemerit(gameState, teamId, playerState, demerit) {
    if (!playerState.modifiers) return;

    if (demerit.type === 'hq_damage') {
        const king = gameState.buildings.find(b => b.team === teamId && b.type === 'king');
        if (king) {
            king.hp -= demerit.value;
        }
    } else if (demerit.type === 'arcana_mult') {
        playerState.modifiers.arcanaRate *= demerit.value;
        if (playerState.modifiers.arcanaRate < 0.1) playerState.modifiers.arcanaRate = 0.1;
    } else if (demerit.type === 'tower_damage_mult') {
        playerState.modifiers.towerDamage *= demerit.value;
    } else if (demerit.type === 'tower_hp_mult') {
        playerState.modifiers.towerHp *= demerit.value;
    }
}

export function playUnitCard(gameState, teamId, cardId, col, row) {
    const playerState = gameState.players[teamId];
    const cardInfo = CARDS[cardId];

    if (!cardInfo || cardInfo.type !== 'VESSEL') return false;

    // Validasi Placement
    if (!isValidPlacement(teamId, col, row)) return false;

    // Proses Cost
    if (!processCardCost(gameState, teamId, cardInfo, cardId)) return false;

    // Spawn Logic
    const count = cardInfo.stats.count || 1;
    const spawnRadius = cardInfo.stats.spawnRadius || 0.5;

    for (let i = 0; i < count; i++) {
        let finalCol = col;
        let finalRow = row;

        if (count > 1) {
            const offset = getRandomOffset(spawnRadius);
            finalCol += offset.x;
            finalRow += offset.y;
            // Clamp
            finalCol = Math.max(1, Math.min(17, finalCol));
        }

        const unit = spawnUnit(gameState, {
            cardId: cardId,
            team: teamId,
            col: finalCol,
            row: finalRow,

            hp: cardInfo.stats.hp,
            damage: cardInfo.stats.damage,
            range: cardInfo.stats.range,
            sightRange: cardInfo.stats.sightRange,
            speed: cardInfo.stats.speed,
            attackSpeed: cardInfo.stats.attackSpeed,
            deployTime: cardInfo.stats.deployTime,
            aimTime: cardInfo.stats.aimTime,
            movementType: cardInfo.stats.movementType,
            targetTeam: cardInfo.stats.targetTeam,
            targetRule: cardInfo.stats.targetRule,
            targetHeight: cardInfo.stats.targetHeight,
            aoeRadius: cardInfo.stats.aoeRadius || 0,
            aoeType: cardInfo.stats.aoeType || 'target',
            projectileType: cardInfo.stats.projectileType || null,
            count: count,
            spawnRadius: spawnRadius,
            traits: cardInfo.stats.traits || {},
        });

        if (unit.traits && unit.traits.onSpawn) {
            triggerTraitEffect(gameState, unit, unit.traits.onSpawn);
        }
    }

    return true;
}

export function playSpellCard(gameState, socketId, teamId, cardId, col, row, targetId) {
    const playerState = gameState.players[teamId];
    const cardInfo = CARDS[cardId];

    if (!cardInfo || cardInfo.type !== 'RITUAL') return false;

    if (cardInfo.spellData && cardInfo.spellData.type === 'single_target') {
        if (!targetId) return false;
        const entities = [...gameState.units, ...gameState.buildings];
        const target = entities.find(e => e.id === targetId);
        if (!target || target.hp <= 0) return false;
    }

    // Proses Cost
    if (!processCardCost(gameState, teamId, cardInfo, cardId)) return false;

    // Cast Logic
    castRitual(gameState, socketId, teamId, cardId, { col, row }, targetId);

    return true;
}

export function playSanctumCard(gameState, teamId, cardId, col, row) {
    const playerState = gameState.players[teamId];
    const cardInfo = CARDS[cardId];

    if (!cardInfo || cardInfo.type !== 'SANCTUM') return false;

    // Validasi Placement
    if (!isValidPlacement(teamId, col, row)) return false;

    // [NEW] Check Building Collision
    const radius = cardInfo.stats.radius || 1.0;
    if (!isValidBuildingPlacement(gameState, col, row, radius)) return false;

    // Proses Cost
    if (!processCardCost(gameState, teamId, cardInfo, cardId)) return false;

    // Spawn Logic
    const building = spawnBuilding(gameState, {
        cardId: cardId,
        team: teamId,
        col: col,
        row: row,
        type: cardId,

        hp: cardInfo.stats.hp,
        damage: cardInfo.stats.damage,
        range: cardInfo.stats.range,
        radius: radius,
        attackSpeed: cardInfo.stats.attackSpeed,
        traits: cardInfo.stats.traits || {}
    });

    if (building.traits && building.traits.onSpawn) {
        triggerTraitEffect(gameState, building, building.traits.onSpawn);
    }

    return true;
}
