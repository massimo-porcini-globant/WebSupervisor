/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.1), consumer: SPA, gate: gate_3_implementation}
App minima E1.1 — il login UI (E2) integrerà il design system dei mockup F01.
*/
import { it } from "@ws/shared";

export default function App() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", maxWidth: "48rem", margin: "0 auto" }}>
      <h1>{it.app.nome}</h1>
      <p>API in sviluppo — le schermate seguiranno l'epica E2 secondo i mockup F01 approvati.</p>
    </main>
  );
}
