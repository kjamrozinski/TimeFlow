import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

const rootElement = document.getElementById("root");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

registerSW({
  onNeedRefresh() {
    if (confirm("Nowa wersja dostępna. Odświeżyć?")) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("Działa offline ✅");
  },
});
