import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove PWA splash screen after app loads
const removeSplashScreen = () => {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    setTimeout(() => {
      splash.classList.add("fade-out");
      setTimeout(() => splash.remove(), 300);
    }, 400);
  }
};

createRoot(document.getElementById("root")!).render(<App />);
removeSplashScreen();
