/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E8.2), consumer: Dashboard, gate: gate_3_implementation}
Pannello attività per progetto (AD-14/15): elenco, creazione, cambio stato inline, ore lavorate,
modifica completa e rimozione. RBAC: azioni solo per PM/admin (il server impone comunque RBAC).
*/
import { useCallback, useEffect, useState } from "react";
import { it, type Attivita, type ProgettoConAvanzamento, type Utente } from "@ws/shared";
import { api, ErroreApi } from "../api.js";

const STATI = ["da-iniziare", "in-corso", "completata", "in-ritardo"] as const;

export default function PannelloAttivita({
  progetto,
  utente,
  chiuso,
}: {
  progetto: ProgettoConAvanzamento;
  utente: Utente;
  chiuso: () => void;
}) {
  const [attivita, setAttivita] = useState<Attivita[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [formAperto, setFormAperto] = useState(false);
  const [inEditing, setInEditing] = useState<Attivita | null>(null);

  const puoScrivere = utente.ruolo === "amministratore" || utente.ruolo === "project_manager";

  const carica = useCallback(async () => {
    try {
      setErrore(null);
      const risposta = await api.attivita(progetto.id);
      setAttivita(risposta.attivita);
    } catch {
      setErrore(it.attivita.erroreCaricamento);
    }
  }, [progetto.id]);

  useEffect(() => {
    void carica();
  }, [carica]);

  async function rimuovi(a: Attivita) {
    if (!window.confirm(it.attivita.confermaRimozione)) return;
    try {
      await api.rimuoviAttivita(a.id);
      await carica();
    } catch {
      setErrore(it.attivita.erroreCaricamento);
    }
  }

  async function aggiorna(id: number, patch: Record<string, unknown>) {
    try {
      setErrore(null);
      await api.aggiornaAttivitaEsistente(id, patch);
      await carica();
    } catch (err) {
      setErrore(err instanceof ErroreApi && err.stato === 403 ? "Non autorizzato a modificare questa attività" : it.attivita.erroreDati);
    }
  }

  return (
    <div className="velo-modale" role="dialog" aria-modal="true" aria-label={`${it.attivita.titolo} — ${progetto.nome}`}>
      <div className="pannello-attivita">
        <div className="intestazione-pagina">
          <h1>
            {it.attivita.titolo} — {progetto.nome}
          </h1>
          <div className="azioni">
            {puoScrivere && (
              <button className="pulsante primario" type="button" onClick={() => { setInEditing(null); setFormAperto(true); }}>
                {it.attivita.nuova}
              </button>
            )}
            <button className="pulsante" type="button" onClick={chiuso}>
              ✕
            </button>
          </div>
        </div>

        {errore && <p className="avviso in-ritardo" role="alert">{errore}</p>}

        {attivita.length === 0 ? (
          <p className="scadenze-vuoto">{it.attivita.nessuna}</p>
        ) : (
          <table className="dati">
            <thead>
              <tr>
                <th scope="col">{it.attivita.nome}</th>
                <th scope="col">{it.attivita.fase}</th>
                <th scope="col">{it.attivita.inizio}</th>
                <th scope="col">{it.attivita.fine}</th>
                <th scope="col">{it.attivita.stato}</th>
                <th scope="col">{it.attivita.lavorateOre}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {attivita.map(a => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.nome}</strong>
                  </td>
                  <td>{a.fase ?? "—"}</td>
                  <td className="data">{a.inizio}</td>
                  <td className="data">{a.fine}</td>
                  <td>
                    {puoScrivere ? (
                      <select value={a.stato} onChange={e => void aggiorna(a.id, { stato: e.target.value })} aria-label={it.attivita.stato}>
                        {STATI.map(s => (
                          <option key={s} value={s}>
                            {it.attivita.nomeStato[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      it.attivita.nomeStato[a.stato]
                    )}
                  </td>
                  <td>
                    {puoScrivere ? (
                      <input
                        className="input-ore"
                        type="number"
                        min={0}
                        value={a.lavorateOre ?? 0}
                        aria-label={it.attivita.lavorateOre}
                        onChange={e => void aggiorna(a.id, { lavorateOre: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    ) : (
                      a.lavorateOre ?? 0
                    )}
                  </td>
                  <td>
                    {puoScrivere && (
                      <>
                        <button className="pulsante pulsante-chiaro" type="button" onClick={() => { setInEditing(a); setFormAperto(true); }}>
                          {it.attivita.modifica}
                        </button>{" "}
                        <button className="pulsante pulsante-chiaro" type="button" onClick={() => void rimuovi(a)}>
                          {it.attivita.rimuovi}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formAperto && (
        <ModuloAttivita
          idProgetto={progetto.id}
          attivita={inEditing}
          chiuso={() => setFormAperto(false)}
          salvato={() => {
            setFormAperto(false);
            void carica();
          }}
        />
      )}
    </div>
  );
}

function ModuloAttivita({
  idProgetto,
  attivita,
  chiuso,
  salvato,
}: {
  idProgetto: number;
  attivita: Attivita | null;
  chiuso: () => void;
  salvato: () => void;
}) {
  const [nome, setNome] = useState(attivita?.nome ?? "");
  const [fase, setFase] = useState(attivita?.fase ?? "");
  const [inizio, setInizio] = useState(attivita?.inizio ?? "");
  const [fine, setFine] = useState(attivita?.fine ?? "");
  const [stato, setStato] = useState<(typeof STATI)[number]>(attivita?.stato ?? "da-iniziare");
  const [stimaOre, setStimaOre] = useState(attivita?.stimaOre ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  async function sottometti(e: React.FormEvent) {
    e.preventDefault();
    setInvio(true);
    setErrore(null);
    const corpo: Record<string, unknown> = {
      nome: nome.trim(),
      fase: fase.trim() || undefined,
      inizio,
      fine,
      stato,
      stimaOre: stimaOre === "" ? undefined : Number(stimaOre),
    };
    try {
      if (attivita) await api.aggiornaAttivitaEsistente(attivita.id, corpo);
      else await api.creaAttivita(idProgetto, corpo);
      salvato();
    } catch {
      setErrore(it.attivita.erroreDati);
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="velo-modale" role="dialog" aria-modal="true" aria-label={it.attivita.formTitolo}>
      <form className="modulo-creazione" onSubmit={sottometti}>
        <h2>{attivita ? it.attivita.modifica : it.attivita.nuova}</h2>
        {errore && <p className="avviso in-ritardo" role="alert">{errore}</p>}
        <label>
          {it.attivita.nome}
          <input value={nome} onChange={e => setNome(e.target.value)} required maxLength={120} />
        </label>
        <label>
          {it.attivita.fase}
          <input value={fase} onChange={e => setFase(e.target.value)} maxLength={80} />
        </label>
        <label>
          {it.attivita.inizio}
          <input type="date" value={inizio} onChange={e => setInizio(e.target.value)} required />
        </label>
        <label>
          {it.attivita.fine}
          <input type="date" value={fine} onChange={e => setFine(e.target.value)} required min={inizio} />
        </label>
        <label>
          {it.attivita.stato}
          <select value={stato} onChange={e => setStato(e.target.value as typeof stato)}>
            {STATI.map(s => (
              <option key={s} value={s}>
                {it.attivita.nomeStato[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {it.attivita.stimaOre}
          <input type="number" min={0} max={10000} value={stimaOre} onChange={e => setStimaOre(e.target.value)} />
        </label>
        <div className="azioni-forma">
          <button className="pulsante" type="button" onClick={chiuso}>
            {it.progetti.formAnnulla}
          </button>
          <button className="pulsante primario" type="submit" disabled={invio}>
            {it.progetti.formCrea}
          </button>
        </div>
      </form>
    </div>
  );
}
