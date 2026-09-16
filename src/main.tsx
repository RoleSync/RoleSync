import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Service Worker registration: only active in production to prevent interfering with Vite HMR/dev server
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {})
        .catch((err) => console.error('Service Worker registration failed:', err));
    });
  } else {
    // In development mode, unregister any existing service worker to avoid stale caching & 408 timeouts
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
