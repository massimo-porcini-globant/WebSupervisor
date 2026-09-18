/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E2.3), consumer: App, gate: gate_3_implementation}
Dashboard Progetti conforme M1 (F01): KPI strip, filtri a chip, tabella avanzamento, stato vuoto, nuovo progetto.
*/
import { useCallback, useEffect, useState } from "react";
import { it, type ProgettoConAvanzamento, type Utente } from "@ws/shared";
import { api, ErroreApi } from "../api.js";
import PannelloAttivita from "./PannelloAttivita.js";

type FiltroStato = "tutti" | "in-linea" | "a-rischio" | "in-ritardo";

const nomiStato = it.progetti.nomeStato;

function formattaData(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Dashboard({ utente }: { utente: Utente }) {
  const [progetti, setProgetti] = useState<ProgettoConAvanzamento[]>([]);
  const [scadenze, setScadenze] = useState<{ progetto: string; data: string; nome: string; stato: string }[]>([]);
  const [totale, setTotale] = useState(0);
  const [filtroStato, setFiltroStato] = useState<FiltroStato>("tutti");
  const [soloAltaPriorita, setSoloAltaPriorita] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [formAperto, setFormAperto] = useState(false);
  const [progettoAttivita, setProgettoAttivita] = useState<ProgettoConAvanzamento | null>(null);

  const puoScrivere = utente.ruolo === "amministratore" || utente.ruolo === "project_manager";

  const carica = useCallback(async () => {
    try {
      setErrore(null);
      const filtri: Record<string, string> = {};
      if (filtroStato !== "tutti") filtri.stato = filtroStato;
      if (soloAltaPriorita) filtri.priorita = "alta";
      const risposta = await api.progetti(filtri);
      setProgetti(risposta.progetti);
      setTotale(risposta.totale);

      const scadenzeAggregate = await Promise.all(
        risposta.progetti.map(async p => {
          try {
            const { kpi } = await api.kpiProgetto(p.id);
            return kpi.scadenzeProssime.map(s => ({ progetto: p.nome, data: s.fine, nome: s.nome, stato: s.stato }));
          } catch {
            return [];
          }
        })
      );
      setScadenze(scadenzeAggregate.flat().sort((x, y) => x.data.localeCompare(y.data)));
    } catch {
      setErrore(it.progetti.erroreCaricamento);
    }
  }, [filtroStato, soloAltaPriorita]);

  useEffect(() => {
    void carica();
  }, [carica]);

  const vuoto = progetti.length === 0 && !errore;

  return (
    <>
      <div className="intestazione-pagina">
        <h1>{it.progetti.titolo}</h1>
        <div className="filtri" role="group" aria-label={it.progetti.titolo}>
          {(["tutti", "in-linea", "a-rischio", "in-ritardo"] as const).map(valore => (
            <button
              key={valore}
              type="button"
              className={`chip ${filtroStato === valore ? "attiva" : ""}`}
              onClick={() => setFiltroStato(valore)}
            >
              {valore === "tutti" ? it.progetti.filtroTutti : nomiStato[valore]}
            </button>
          ))}
          <button
            type="button"
            className={`chip ${soloAltaPriorita ? "attiva" : ""}`}
            aria-pressed={soloAltaPriorita}
            onClick={() => setSoloAltaPriorita(v => !v)}
          >
            {it.progetti.filtroPrioritaAlta}
          </button>
        </div>
        <div className="azioni">
          {puoScrivere && (
            <button className="pulsante primario" type="button" onClick={() => setFormAperto(true)}>
              {it.progetti.nuovoProgetto}
            </button>
          )}
        </div>
      </div>

      {errore && <p className="avviso in-ritardo" role="alert">{errore}</p>}

      {!vuoto && (
        <section className="blocco" aria-label="Riepilogo">
          <div className="kpi">
            <div className="voce">
              <div className="numero">{totale}</div>
              <div className="etichetta">{it.progetti.kpiAttivi}</div>
            </div>
            <div className="voce">
              <div className="numero">{progetti.filter(p => p.stato === "in-linea").length}</div>
              <div className="etichetta">{it.progetti.kpiInLinea}</div>
            </div>
            <div className="voce a-rischio">
              <div className="numero">{progetti.filter(p => p.stato === "a-rischio").length}</div>
              <div className="etichetta">{it.progetti.kpiARischio}</div>
            </div>
            <div className="voce in-ritardo">
              <div className="numero">{progetti.filter(p => p.stato === "in-ritardo").length}</div>
              <div className="etichetta">{it.progetti.kpiInRitardo}</div>
            </div>
          </div>
        </section>
      )}

      {!vuoto && (
        <section className="blocco" aria-label="Elenco progetti">
          <h2>
            {it.progetti.avlzTitolo} <small>{it.progetti.avlzNota}</small>
          </h2>
          <table className="dati">
            <thead>
              <tr>
                <th scope="col">{it.progetti.colStato}</th>
                <th scope="col">{it.progetti.colProgetto}</th>
                <th scope="col">{it.progetti.colTeam}</th>
                <th scope="col">{it.progetti.colPriorita}</th>
                <th scope="col">{it.progetti.colAvanzamento}</th>
                <th scope="col">{it.progetti.colFine}</th>
              </tr>
            </thead>
            <tbody>
              {progetti.map(p => (
                <tr key={p.id} className={`riga-${p.stato === "in-ritardo" ? "ritardo" : p.stato === "a-rischio" ? "rischio" : ""}`}>
                  <td>
                    <span className={`punto-stato ${p.stato}`} /> {nomiStato[p.stato]}
                  </td>
                  <td>
                    <strong>{p.nome}</strong>{" "}
                    <button className="pulsante pulsante-chiaro" type="button" onClick={() => setProgettoAttivita(p)}>
                      {it.attivita.titolo}
                    </button>
                  </td>
                  <td>{p.teamId ?? "—"}</td>
                  <td>
                    <span className={`badge priorita-${p.priorita}`}>{it.progetti.priorita[p.priorita]}</span>
                  </td>
                  <td>
                    <div className={`avanzamento ${p.stato === "in-ritardo" ? "tardivo" : ""}`}>
                      <div className="traccia">
                        <div className="riempimento" style={{ width: `${p.avanzamento ?? 0}%` }} />
                      </div>
                      <span className="valore">{p.avanzamento === null ? it.progetti.avanzamentoND : `${p.avanzamento}%`}</span>
                    </div>
                  </td>
                  <td className="data">{formattaData(p.fine)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!vuoto && (
        <section className="blocco" aria-label="Scadenze imminenti">
          <h2>{it.progetti.scadenzeTitolo}</h2>
          {scadenze.length === 0 ? (
            <p className="scadenze-vuoto">{it.progetti.scadenzeVuoto}</p>
          ) : (
            scadenze.map((s, i) => (
              <div key={`${s.progetto}-${i}`} className={`avviso ${s.stato === "in-ritardo" ? "in-ritardo" : "a-rischio"}`}>
                <strong>{formattaData(s.data)}</strong>
                <span>
                  <strong>{s.progetto}</strong> — {s.nome} ({nomiStato[s.stato as keyof typeof nomiStato] ?? s.stato})
                </span>
              </div>
            ))
          )}
        </section>
      )}

      {vuoto && (
        <div className="vuoto" aria-live="polite">
          <span className="icona" aria-hidden="true">
            🗂
          </span>
          <h2>{it.progetti.nessunProgetto}</h2>
          <p>{it.progetti.nessunProgettoTesto}</p>
          {puoScrivere && (
            <button className="pulsante primario" type="button" onClick={() => setFormAperto(true)}>
              {it.progetti.creaPrimoProgetto}
            </button>
          )}
        </div>
      )}

      {formAperto && <ModuloNuovoProgetto chiuso={() => setFormAperto(false)} creato={() => { setFormAperto(false); void carica(); }} />}
      {progettoAttivita && (
        <PannelloAttivita progetto={progettoAttivita} utente={utente} chiuso={() => { setProgettoAttivita(null); void carica(); }} />
      )}
    </>
  );
}

function ModuloNuovoProgetto({ chiuso, creato }: { chiuso: () => void; creato: () => void }) {
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [priorita, setPriorita] = useState<"alta" | "media" | "bassa">("media");
  const [inizio, setInizio] = useState("");
  const [fine, setFine] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  async function sottometti(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore(null);
    setInvio(true);
    try {
      await api.creaProgetto({ nome: nome.trim(), descrizione: descrizione.trim() || undefined, priorita, inizio, fine });
      creato();
    } catch (errore) {
      setErrore(errore instanceof ErroreApi && errore.stato === 400 ? "Dati non validi: controlla i campi" : "Errore di connessione");
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="velo-modale" role="dialog" aria-modal="true" aria-label={it.progetti.formTitolo}>
      <form className="modulo-creazione" onSubmit={sottometti}>
        <h2>{it.progetti.formTitolo}</h2>
        {errore && (
          <p className="avviso in-ritardo" role="alert">
            {errore}
          </p>
        )}
        <label>
          {it.progetti.formNome}
          <input value={nome} onChange={e => setNome(e.target.value)} required maxLength={120} />
        </label>
        <label>
          {it.progetti.formDescrizione}
          <textarea value={descrizione} onChange={e => setDescrizione(e.target.value)} maxLength={2000} rows={2} />
        </label>
        <label>
          {it.progetti.formPriorita}
          <select value={priorita} onChange={e => setPriorita(e.target.value as typeof priorita)}>
            <option value="alta">{it.progetti.priorita.alta}</option>
            <option value="media">{it.progetti.priorita.media}</option>
            <option value="bassa">{it.progetti.priorita.bassa}</option>
          </select>
        </label>
        <label>
          {it.progetti.formInizio}
          <input type="date" value={inizio} onChange={e => setInizio(e.target.value)} required />
        </label>
        <label>
          {it.progetti.formFine}
          <input type="date" value={fine} onChange={e => setFine(e.target.value)} required min={inizio} />
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
