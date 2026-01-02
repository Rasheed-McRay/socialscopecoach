import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Lock screen orientation to portrait on mobile/PWA
const lockOrientation = async () => {
  try {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('portrait');
    }
  } catch (e) {
    // Orientation lock not supported or not in fullscreen/PWA mode
  }
};
lockOrientation();

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
