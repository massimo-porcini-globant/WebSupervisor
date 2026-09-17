/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E2.3), consumer: SPA, gate: gate_3_implementation}
App: verifica sessione (/auth/me), login e Dashboard conforme M1.
*/
import { useEffect, useState } from "react";
import { it, type Utente } from "@ws/shared";
import { api } from "./api.js";
import SchermataLogin from "./components/SchermataLogin.js";
import Dashboard from "./components/Dashboard.js";

export default function App() {
  const [utente, setUtente] = useState<Utente | null>(null);
  const [verifica, setVerifica] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(risposta => setUtente(risposta.utente))
      .catch(() => setUtente(null))
      .finally(() => setVerifica(false));
  }, []);

  async function esci() {
    try {
      await api.logout();
    } finally {
      setUtente(null);
    }
  }

  if (verifica) return null;

  if (!utente) return <SchermataLogin alLogin={() => void api.me().then(r => setUtente(r.utente))} />;

  return (
    <>
      <header className="testata">
        <span className="marchio">
          <strong>Web</strong>Supervisor
        </span>
        <nav className="navigazione" aria-label="Principale">
          <a href="/" aria-current="page">
            {it.nav.progetti}
          </a>
          <a href="/gantt" title="Prevista in E4 — Gantt">
            {it.nav.gantt}
          </a>
          <a href="/team" title="Prevista in E5 — Team">
            {it.nav.team}
          </a>
          <a href="/risorse" title="Prevista in E6 — Allocazione">
            {it.nav.risorse}
          </a>
        </nav>
        <div className="utente">
          <span>{utente.username}</span>
          <span className="iniziali" title={it.ruoli[utente.ruolo]}>
            {utente.username.slice(0, 2).toUpperCase()}
          </span>
          <button className="pulsante pulsante-chiaro" type="button" onClick={() => void esci()}>
            {it.auth.logout}
          </button>
        </div>
      </header>
      <main className="contenuto">
        <Dashboard utente={utente} />
      </main>
    </>
  );
}
