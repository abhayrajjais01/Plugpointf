/**
 * --- THE ENGINE START ---
 * This is the very first file that runs when someone opens 
 * the website. It "Initializes" our React app and injects 
 * it into the main HTML file.
 */

import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// 1. Find the <div id="root"> element in index.html
const rootElement = document.getElementById("root");
console.log("App Initialization: Script started");

if (rootElement) {
  // 2. Wrap our whole <App /> in the React engine and 
  // draw it onto the screen!
  try {
    console.log("App Initialization: Root element found, starting render...");
    createRoot(rootElement).render(<App />);
    console.log("App Initialization: Render called successfully");
  } catch (error: any) {
    console.error("App Initialization: FAILED TO RENDER", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;"><h1>Mount Failed</h1><pre>${error?.stack || error?.message || String(error)}</pre></div>`;
  }
}