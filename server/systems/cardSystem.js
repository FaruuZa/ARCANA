import { CARDS } from "../../shared/data/cards.js";
import { spawnUnit } from "../gameState.js";
import { castRitual } from "./spellSystem.js";
import { isValidPlacement } from "../rules/placement.js";
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

export function processCardCost(playerState, cardInfo, cardId) {
  const cardIndex = playerState.hand.indexOf(cardId);
  if (cardIndex === -1) return false; // Kartu gak ada di tangan (Cheat?)

  if (playerState.arcana < cardInfo.cost) return false; // Duit gak cukup

  // 1. Bayar
  playerState.arcana -= cardInfo.cost;

  // 2. GANTI KARTU (Refill Mode: Random Pick from Pool)
  // Tidak ada "Buang" kartu karena deck adalah pool statis.
  // Hand slot yang kosong diisi ulang random. (Duplicate allowed per user request)
  
  if (playerState.deck.length > 0) {
      const randomReplacement = playerState.deck[Math.floor(Math.random() * playerState.deck.length)];
      playerState.hand[cardIndex] = randomReplacement;
  } else {
      // Fallback jika deck kosong (Mustahil di mode ini tapi safety)
      // playerState.hand.splice(cardIndex, 1);
  }
  
  // Update Next Card (Just cosmetic in this mode, pick another random)
  playerState.next = playerState.deck[Math.floor(Math.random() * playerState.deck.length)];

  // [NEW] Process Taboo Demerit
  if (cardInfo.isTaboo && cardInfo.demerit) {
      processDemerit(playerState, cardInfo.demerit);
  }

  return true; 
}

// [NEW] Helper: Taboo Demerit Logic
function processDemerit(playerState, demerit) {
    if (!playerState.modifiers) return;

    if (demerit.type === 'arcana_mult') {
        playerState.modifiers.arcanaRate *= demerit.value;
        // Opsional: Clamp min rate?
        if (playerState.modifiers.arcanaRate < 0.1) playerState.modifiers.arcanaRate = 0.1;
    }
    else if (demerit.type === 'tower_damage_mult') {
        playerState.modifiers.towerDamage *= demerit.value;
    }
    else if (demerit.type === 'tower_hp_mult') {
        playerState.modifiers.towerHp *= demerit.value;
        // Note: Changing MaxHP on the fly is tricky for existing buildings, usually applies to new spawns
        // or we iterate buildings and cut HP? 
        // For simplicity: Just modifier, logic elsewhere handles it if needed.
    }
}

export function playUnitCard(gameState, teamId, cardId, col, row) {
    const playerState = gameState.players[teamId];
    const cardInfo = CARDS[cardId];
    
    if (!cardInfo || cardInfo.type !== 'VESSEL') return false;

    // Validasi Placement
    if (!isValidPlacement(teamId, col, row)) return false;

    // Proses Cost
    if (!processCardCost(playerState, cardInfo, cardId)) return false;

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

export function playSpellCard(gameState, socketId, teamId, cardId, col, row, targetId) { // [NEW] Added targetId param
    const playerState = gameState.players[teamId];
    const cardInfo = CARDS[cardId];
    
    if (!cardInfo || cardInfo.type !== 'RITUAL') return false;

    // Logic Ritual (Spell) biasanya valid di mana saja (Global Cast) 
    // atau cek area valid? Asumsi global/bebas.

    // [FIX] Validate Single Target requirement BEFORE paying cost
    if (cardInfo.spellData && cardInfo.spellData.type === 'single_target') {
        if (!targetId) return false; // Fail cast if no target
        
        // Optional: Check if target exists/valid here too? 
        // Or let castRitual handle it? If castRitual aborts, we already paid!
        // So we MUST validate basic existence here to be safe.
        const entities = [...gameState.units, ...gameState.buildings];
        const target = entities.find(e => e.id === targetId);
        if (!target || target.hp <= 0) return false;
    }

    // Proses Cost
    if (!processCardCost(playerState, cardInfo, cardId)) return false;

    // Cast Logic
    castRitual(gameState, socketId, teamId, cardId, { col, row }, targetId); // [NEW] Pass targetId
    
    return true;
}
