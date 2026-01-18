console.log("MAIN JS LOADED");

import { initSocket } from "./net/socket.js";
import { initRenderer } from "./render/renderer.js";

const container = document.getElementById("canvas-container");

// 1. BUAT APP SEKALI SAJA
const app = new PIXI.Application({
  resizeTo: container,
  backgroundColor: 0xffffff,
  autoDensity: true,
  antialias: true
});

// 2. APPEND CANVAS
container.appendChild(app.view);
app.stage.sortableChildren = true;

// 3. INIT RENDER (ISI STAGE)
initRenderer(app);

// 4. INIT SOCKET (STATE MASUK)
initSocket();
