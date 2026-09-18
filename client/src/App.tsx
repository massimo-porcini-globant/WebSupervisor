/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E2.3), consumer: SPA, gate: gate_3_implementation}
App: verifica sessione (/auth/me), login e Dashboard conforme M1.
*/
import { useEffect, useState } from "react";
import { it, type Utente } from "@ws/shared";
import { api } from "./api.js";
import SchermataLogin from "./components/SchermataLogin.js";
import Dashboard from "./components/Dashboard.js";
import SchermataGantt from "./components/SchermataGantt.js";
import SchermataTeam from "./components/SchermataTeam.js";

function paginaCorrente(): "progetti" | "gantt" | "team" {
  if (window.location.pathname === "/gantt") return "gantt";
  if (window.location.pathname === "/team") return "team";
  return "progetti";
}

export default function App() {
  const [utente, setUtente] = useState<Utente | null>(null);
  const [verifica, setVerifica] = useState(true);
  const [pagina, setPagina] = useState(paginaCorrente);

  useEffect(() => {
    const alPop = () => setPagina(paginaCorrente());
    window.addEventListener("popstate", alPop);
    return () => window.removeEventListener("popstate", alPop);
  }, []);

  function naviga(percorso: string) {
    window.history.pushState({}, "", percorso);
    setPagina(paginaCorrente());
  }

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
          <a href="/" aria-current={pagina === "progetti" ? "page" : undefined} onClick={e => { e.preventDefault(); naviga("/"); }}>
            {it.nav.progetti}
          </a>
          <a href="/gantt" aria-current={pagina === "gantt" ? "page" : undefined} onClick={e => { e.preventDefault(); naviga("/gantt"); }}>
            {it.nav.gantt}
          </a>
          <a href="/team" aria-current={pagina === "team" ? "page" : undefined} onClick={e => { e.preventDefault(); naviga("/team"); }}>
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
        {pagina === "gantt" ? <SchermataGantt /> : pagina === "team" ? <SchermataTeam utente={utente} /> : <Dashboard utente={utente} />}
      </main>
    </>
  );
}
