import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Track when the page started loading
const pageLoadStart = performance.now();

// Remove PWA splash screen after minimum display time
const removeSplashScreen = () => {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    const elapsed = performance.now() - pageLoadStart;
    const minDisplayTime = 2000; // Minimum 2 seconds
    const remainingTime = Math.max(0, minDisplayTime - elapsed);
    
    setTimeout(() => {
      splash.classList.add("fade-out");
      setTimeout(() => splash.remove(), 600);
    }, remainingTime);
  }
};

createRoot(document.getElementById("root")!).render(<App />);
removeSplashScreen();
