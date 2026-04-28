/**
 * --- THE ENGINE START ---
 * This is the very first file that runs when someone opens 
 * the website. It "Initializes" our React app and injects 
 * it into the main HTML file.
 */

import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { logger } from "./lib/logger";

// 1. Find the <div id="root"> element in index.html
const rootElement = document.getElementById("root");
logger.log("App Initialization: Script started");

if (rootElement) {
  // 2. Wrap our whole <App /> in the React engine and 
  // draw it onto the screen!
  try {
    logger.log("App Initialization: Root element found, starting render...");
    createRoot(rootElement).render(<App />);
    logger.log("App Initialization: Render called successfully");
  } catch (error: any) {
    logger.error("App Initialization: FAILED TO RENDER", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;"><h1>Mount Failed</h1><pre>${error?.stack || error?.message || String(error)}</pre></div>`;
  }
}