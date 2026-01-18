import { updateTargeting } from "./systems/targetingSystem.js";
import { updateMovement } from "./systems/movementSystem.js";
import { updateAttacks } from "./systems/attackSystem.js";
import { cleanupSystem } from "./systems/cleanupSystem.js";
import { updateProjectiles } from "./systems/projectileSystem.js";

const TICK_RATE = 20;
const DT = 1 / TICK_RATE;

export function gameLoop(gameState) {
  updateTargeting(gameState);
  updateMovement(gameState, DT);
  updateAttacks(gameState, DT);
  updateProjectiles(gameState, DT);
  
  cleanupSystem(gameState);
  gameState.tick++;
}
