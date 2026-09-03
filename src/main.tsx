import React from "react";
import ReactDOM from "react-dom/client";
import { isTauri } from "@tauri-apps/api/core";
import App from "./App";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// The desktop build always has 100% local access to its own bundled files —
// a PWA-style offline service worker is pointless there and actively
// dangerous: after an app update the WebView keeps the old worker, which
// can serve an old index.html pointing at JS/CSS filenames the new build no
// longer has, leaving the window blank. Only register it for the real
// browser-hosted PWA, and actively unregister/clear it under Tauri so an
// install that already picked one up (e.g. from 0.1.2) heals itself.
if ("serviceWorker" in navigator) {
  if (isTauri()) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) registration.unregister();
    });
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  } else if (import.meta.env.PROD) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
  }
}
