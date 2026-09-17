/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.1), consumer: SPA, gate: gate_3_implementation}
*/
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";

createRoot(document.getElementById("radice")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
