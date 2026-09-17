/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E2.3), consumer: App, gate: gate_3_implementation}
Schermata di accesso conforme al design system F01 (testata minimizzata, modulo centrato).
*/
import { useState } from "react";
import { it } from "@ws/shared";
import { api, ErroreApi } from "../api.js";

export default function SchermataLogin({ alLogin }: { alLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  async function sottometti(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore(null);
    setInvio(true);
    try {
      await api.login(username.trim(), password);
      alLogin();
    } catch (errore) {
      setErrore(errore instanceof ErroreApi && errore.stato === 401 ? it.auth.credenzialiErrate : "Errore di connessione");
    } finally {
      setInvio(false);
    }
  }

  return (
    <main className="contenuto schermata-login">
      <form className="modulo-login" onSubmit={sottometti}>
        <span className="marchio-login">
          <strong>Web</strong>Supervisor
        </span>
        <h1>{it.auth.login}</h1>
        {errore && (
          <p className="avviso in-ritardo" role="alert">
            {errore}
          </p>
        )}
        <label>
          {it.auth.username}
          <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required minLength={3} />
        </label>
        <label>
          {it.auth.password}
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required minLength={8} />
        </label>
        <button className="pulsante primario" type="submit" disabled={invio}>
          {it.auth.login}
        </button>
      </form>
    </main>
  );
}
