/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E4.2/E4.3/E4.4), consumer: App, gate: gate_3_implementation}
Schermata Gantt conforme M2 (F01): frappe-gantt (AD-1), zoom giorno/settimana/mese, drag&drop
date_change con conferma → PATCH, dipendenze con frecce + editor, overlay percorso critico (RF-08..13).
*/
import { useCallback, useEffect, useRef, useState } from "react";
import Gantt from "frappe-gantt";
import "../assets/frappe-gantt.css";
import { it, type Gantt as DatiGantt, type ProgettoConAvanzamento } from "@ws/shared";
import { api, ErroreApi } from "../api.js";

type Zoom = "Day" | "Week" | "Month";

const zoomEtichette: Record<Zoom, string> = {
  Day: it.gantt.zoomGiorno,
  Week: it.gantt.zoomSettimana,
  Month: it.gantt.zoomMese,
};

export default function SchermataGantt() {
  const [progetti, setProgetti] = useState<ProgettoConAvanzamento[]>([]);
  const [idSelezionato, setIdSelezionato] = useState<number | null>(null);
  const [dati, setDati] = useState<DatiGantt | null>(null);
  const [zoom, setZoom] = useState<Zoom>("Day");
  const [soloCritiche, setSoloCritiche] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCaricamento, setInCaricamento] = useState(false);

  const contenitore = useRef<HTMLDivElement>(null);
  const istanza = useRef<InstanceType<typeof Gantt> | null>(null);

  const caricaProgetti = useCallback(async () => {
    try {
      const risposta = await api.progetti({});
      setProgetti(risposta.progetti);
      setIdSelezionato(prima => prima ?? risposta.progetti[0]?.id ?? null);
    } catch {
      setErrore(it.gantt.erroreCaricamento);
    }
  }, []);

  useEffect(() => {
    void caricaProgetti();
  }, [caricaProgetti]);

  const caricaGantt = useCallback(async () => {
    if (idSelezionato === null) return;
    setInCaricamento(true);
    try {
      setErrore(null);
      setDati(await api.gantt(idSelezionato));
    } catch {
      setErrore(it.gantt.erroreCaricamento);
      setDati(null);
    } finally {
      setInCaricamento(false);
    }
  }, [idSelezionato]);

  useEffect(() => {
    void caricaGantt();
  }, [caricaGantt]);

  const confermato = useCallback(
    async (id: number, inizio: string, fine: string) => {
      try {
        await api.aggiornaAttivita(id, { inizio, fine });
        await caricaGantt();
      } catch (errore) {
        setErrore(errore instanceof ErroreApi && errore.stato === 400 ? it.gantt.erroreSpostamento : it.gantt.erroreCaricamento);
      }
    },
    [caricaGantt]
  );

  useEffect(() => {
    if (!dati || !contenitore.current) return;
    const attivitaVisibili = soloCritiche ? dati.attivita.filter(a => a.critica) : dati.attivita;
    if (attivitaVisibili.length === 0) {
      contenitore.current.innerHTML = "";
      istanza.current = null;
      return;
    }
    contenitore.current.innerHTML = "";
    istanza.current = new Gantt(contenitore.current, attivitaVisibili.map(a => ({
      id: String(a.id),
      name: a.nome,
      start: a.inizio,
      end: a.fine,
      progress: 0,
      custom_class: a.critica ? "barra-critica" : undefined,
      dependencies: dati.dipendenze
        .filter(d => d.taskId === a.id)
        .map(d => String(d.dependsOn))
        .join(","),
    })), {
      view_mode: zoom,
      language: "it",
      readonly_dates: false,
      on_date_change: (task: { id: string }, inizio: Date, fine: Date) => {
        const isoInizio = inizio.toISOString().slice(0, 10);
        const isoFine = fine.toISOString().slice(0, 10);
        if (window.confirm(`${it.gantt.confermaSpostamento} ${isoInizio} → ${isoFine}`)) {
          void confermato(Number(task.id), isoInizio, isoFine);
        } else {
          void caricaGantt();
        }
      },
    });
  }, [dati, zoom, soloCritiche, confermato, caricaGantt]);

  const selezionato = progetti.find(p => p.id === idSelezionato) ?? null;

  return (
    <>
      <div className="intestazione-pagina">
        <h1>
          {it.gantt.titolo} <small>{it.gantt.nota}</small>
        </h1>
        <label className="campo-progetto">
          {it.gantt.scegliProgetto}
          <select value={idSelezionato ?? ""} onChange={e => setIdSelezionato(Number(e.target.value))}>
            {progetti.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="azioni">
          <div className="filtri" role="group" aria-label={it.gantt.titolo}>
            {(Object.keys(zoomEtichette) as Zoom[]).map(z => (
              <button key={z} type="button" className={`chip ${zoom === z ? "attiva" : ""}`} onClick={() => setZoom(z)}>
                {zoomEtichette[z]}
              </button>
            ))}
            <button
              type="button"
              className={`chip ${soloCritiche ? "attiva" : ""}`}
              aria-pressed={soloCritiche}
              onClick={() => setSoloCritiche(v => !v)}
            >
              {it.gantt.soloCritiche}
            </button>
          </div>
        </div>
      </div>

      {errore && (
        <p className="avviso in-ritardo" role="alert">
          {errore}
        </p>
      )}

      {inCaricamento && <p>…</p>}

      {!inCaricamento && progetti.length === 0 && (
        <div className="vuoto" aria-live="polite">
          <h2>{it.gantt.nessunProgetto}</h2>
        </div>
      )}

      {!inCaricamento && selezionato && dati && dati.attivita.length === 0 && (
        <div className="vuoto" aria-live="polite">
          <h2>{it.gantt.titolo}</h2>
          <p>{it.attivita.nessunaGantt}</p>
          <button
            className="pulsante primario"
            type="button"
            onClick={() => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            {it.attivita.vaiProgetti}
          </button>
        </div>
      )}

      {!inCaricamento && selezionato && dati && dati.attivita.length > 0 && (
        <section className="blocco" aria-label={it.gantt.titolo}>
          <div className="legenda-gantt">
            <span className="voce">
              <span className="campiona critico" /> {it.gantt.legendaCritico}
            </span>
            <span className="voce">
              <span className="campiona normale" /> Attività
            </span>
          </div>
          <div className="contenitore-gantt" ref={contenitore} />
          <EditorDipendenze dati={dati} aggiornato={() => void caricaGantt()} />
        </section>
      )}
    </>
  );
}

function EditorDipendenze({ dati, aggiornato }: { dati: DatiGantt; aggiornato: () => void }) {
  const [taskId, setTaskId] = useState<number | null>(null);
  const [dependsOn, setDependsOn] = useState<number | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const nomi = new Map(dati.attivita.map(a => [a.id, a.nome]));

  async function aggiungi() {
    if (taskId === null || dependsOn === null || taskId === dependsOn) return;
    try {
      setErrore(null);
      await api.aggiungiDipendenza(taskId, dependsOn);
      aggiornato();
    } catch {
      setErrore(it.gantt.erroreSpostamento);
    }
  }

  async function rimuovi(t: number, d: number) {
    try {
      await api.rimuoviDipendenza(t, d);
      aggiornato();
    } catch {
      setErrore(it.gantt.erroreCaricamento);
    }
  }

  return (
    <div className="editor-dipendenze">
      <h2>{it.gantt.dipendenze}</h2>
      {errore && (
        <p className="avviso in-ritardo" role="alert">
          {errore}
        </p>
      )}
      {dati.dipendenze.length === 0 ? (
        <p className="scadenze-vuoto">{it.gantt.nessunaDipendenza}</p>
      ) : (
        dati.dipendenze.map(d => (
          <div key={`${d.taskId}-${d.dependsOn}`} className="riga-dipendenza">
            <span>
              <strong>{nomi.get(d.taskId) ?? d.taskId}</strong> {it.gantt.dipendenzaDa}{" "}
              <strong>{nomi.get(d.dependsOn) ?? d.dependsOn}</strong>
            </span>
            <button type="button" className="pulsante pulsante-chiaro" onClick={() => void rimuovi(d.taskId, d.dependsOn)}>
              {it.gantt.rimuoviDipendenza}
            </button>
          </div>
        ))
      )}
      <div className="riga-dipendenza">
        <select aria-label={it.gantt.dipendenze} value={taskId ?? ""} onChange={e => setTaskId(Number(e.target.value))}>
          <option value="" disabled>
            {it.gantt.dipendenze}
          </option>
          {dati.attivita.map(a => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
        <select aria-label={it.gantt.dipendenzaDa} value={dependsOn ?? ""} onChange={e => setDependsOn(Number(e.target.value))}>
          <option value="">{it.gantt.dipendenzaDa}</option>
          {dati.attivita.map(a => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
        <button type="button" className="pulsante" onClick={() => void aggiungi()} disabled={taskId === null || dependsOn === null}>
          {it.gantt.aggiungiDipendenza}
        </button>
      </div>
    </div>
  );
}
