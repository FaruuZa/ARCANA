console.log("MAIN JS LOADED");

import { initSocket } from "./net/socket.js";
import { initRenderer } from "./render/renderer.js";
import { initInput } from "./input/pointer.js"
import { initUI } from "./render/ui.js";
import { initLobby } from "./lobby.js"; // [NEW]

const container = document.getElementById("canvas-container");

// 1. BUAT APP SEKALI SAJA
const app = new PIXI.Application({
  resizeTo: container,
  backgroundColor: 0x050508,
  autoDensity: true,
  antialias: true
});

// 2. APPEND CANVAS
container.appendChild(app.view);
app.stage.sortableChildren = true;

// 3. INIT RENDER (ISI STAGE)
initRenderer(app);

// 4. INIT SOCKET (STATE MASUK)
// initSocket returns socket instance if needed, but it sets up listeners
initSocket();

// 5. SETUP INPUT & UI listeners
initInput(app);
initUI();

// 6. INIT LOBBY (Starts the flow)
initLobby();
