// server/gameLoop.js

import { updateTargeting } from "./systems/targetingSystem.js";
import { updateMovement } from "./systems/movementSystem.js";
import { updateAttacks } from "./systems/attackSystem.js";
import { updateProjectiles } from "./systems/projectileSystem.js"; 
import { updateBuffs } from "./systems/buffSystem.js"; // [NEW]
import { cleanupSystem } from "./systems/cleanupSystem.js";
import { MAX_ARCANA, ARCANA_REGEN_PER_SEC } from "../shared/constants.js"; // Import constants

export function gameLoop(gameState, dt) {
  // Update Systems
  updateBuffs(gameState, dt); // [NEW]
  updateTargeting(gameState, dt);
  updateMovement(gameState, dt);
  updateAttacks(gameState, dt);
  updateProjectiles(gameState, dt);
  
  for (const teamId in gameState.players) {
      const player = gameState.players[teamId];
      
      if (player.arcana < MAX_ARCANA) {
          player.arcana += ARCANA_REGEN_PER_SEC * dt;
          
          // Clamp agar tidak lebih
          if (player.arcana > MAX_ARCANA) {
              player.arcana = MAX_ARCANA;
          }
      }
  }

  cleanupSystem(gameState, dt);
  gameState.tick++;
}