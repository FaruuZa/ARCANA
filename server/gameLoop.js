import { updateUnits } from "./gameState.js";

const TICK_RATE = 20;
const DT = 1 / TICK_RATE;

export function startGameLoop(gameState, io) {

  console.log("GAME LOOP STARTED");

  setInterval(() => {
    gameState.tick++;

    updateUnits(gameState, DT);

    io.emit("state", gameState);
  }, 1000 / TICK_RATE);
}
