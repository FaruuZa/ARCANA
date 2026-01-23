// server/gameLoop.js

import { updateTargeting } from "./systems/targetingSystem.js";
import { updateMovement } from "./systems/movementSystem.js";
import { updateAttacks } from "./systems/attackSystem.js";
import { updateProjectiles } from "./systems/projectileSystem.js"; 
import { updateBuffs } from "./systems/buffSystem.js"; // [NEW]
import { cleanupSystem } from "./systems/cleanupSystem.js";
import { processDeaths } from "./systems/deathSystem.js"; // [FIX] Import
import { updateSpells } from "./systems/spellSystem.js"; // [NEW]
import { updateSpawners } from "./systems/spawnerSystem.js"; // [NEW]
import { MAX_ARCANA, ARCANA_REGEN_PER_SEC } from "../shared/constants.js"; // [FIX] Re-add
import { getOmenMultiplier } from "./systems/omenSystem.js"; // [NEW]

export function gameLoop(gameState, dt) {
  // 0. Update Spatial Hash (Start of Frame)
  gameState.spatialHash.clear();
  const allEntities = [...gameState.units, ...gameState.buildings];
  for (const ent of allEntities) {
      if (ent.hp > 0) gameState.spatialHash.insert(ent);
  }

  // Update Systems
  updateSpells(gameState, dt);
  updateBuffs(gameState, dt);
  updateTargeting(gameState, dt);
  updateMovement(gameState, dt);
  updateAttacks(gameState, dt);
  updateSpawners(gameState, dt); // [NEW]
  updateProjectiles(gameState, dt);
  
  // [FIX] Process Deaths BEFORE Cleanup
  processDeaths(gameState);
  
  const regenMult = getOmenMultiplier(gameState, 'arcana_regen'); // [NEW]

  for (const teamId in gameState.players) {
      const player = gameState.players[teamId];
      
      if (player.arcana < MAX_ARCANA) {
          // [FIX] Apply Omen AND Taboo Modifiers
          const tabooMult = player.modifiers ? player.modifiers.arcanaRate : 1.0;
          const totalMult = regenMult * tabooMult;
          
          player.arcana += ARCANA_REGEN_PER_SEC * totalMult * dt; 
          
          // Clamp agar tidak lebih
          if (player.arcana > MAX_ARCANA) {
              player.arcana = MAX_ARCANA;
          }
      }
  }

  cleanupSystem(gameState, dt);
  gameState.tick++;
}