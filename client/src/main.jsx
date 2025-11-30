import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Rejestracja Service Workera
registerSW({
  onNeedRefresh() {
    if (confirm("Nowa wersja dostępna. Odświeżyć?")) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("Działa offline 🚀");
  },
});
