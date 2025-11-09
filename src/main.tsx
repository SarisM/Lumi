
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { registerServiceWorker } from "./utils/pwa";

  createRoot(document.getElementById("root")!).render(<App />);
  // Register service worker to enable background notifications and caching.
  // It will noop on browsers that don't support service workers.
  registerServiceWorker();
  