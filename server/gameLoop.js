// server/gameLoop.js

import { updateTargeting } from "./systems/targetingSystem.js";
import { updateMovement } from "./systems/movementSystem.js";
import { updateAttacks } from "./systems/attackSystem.js";
import { updateProjectiles } from "./systems/projectileSystem.js"; // Jangan lupa ini
import { cleanupSystem } from "./systems/cleanupSystem.js";
import { MAX_ARCANA, ARCANA_REGEN_PER_SEC } from "../shared/constants.js"; // Import constants

export function gameLoop(gameState, dt) {
  // Update Systems
  updateTargeting(gameState, dt);
  updateMovement(gameState, dt);
  updateAttacks(gameState, dt);
  updateProjectiles(gameState, dt);
  
  // === [FIX BUG 2] REGENERASI ARCANA ===
  // Pastikan blok ini ada!
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

  cleanupSystem(gameState);
  gameState.tick++;
}