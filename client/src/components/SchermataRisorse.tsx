/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E9.5), consumer: App, gate: gate_3_implementation}
Schermata Risorse conforme M-allocation (F01): avvisi sovra-allocazione (RF-20), piano
"chi lavora su cosa e quando" (RF-19), carico per persona (RF-21), stato vuoto, modale assegnazione.
*/
import { useCallback, useEffect, useState } from "react";
import { it, type RigaPiano, type AvvisoSovra, type Membro } from "@ws/shared";
import { api, ErroreApi } from "../api.js";

const GIORNO_MS = 86_400_000;

function iso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function lunediCorrente(): string {
  const oggi = new Date();
  const giorno = (oggi.getDay() + 6) % 7;
  const lunedi = new Date(oggi.getTime() - giorno * GIORNO_MS);
  return iso(lunedi);
}

function sommaGiorni(isoData: string, giorni: number): string {
  return iso(new Date(new Date(isoData + "T00:00:00Z").getTime() + giorni * GIORNO_MS));
}

export default function SchermataRisorse() {
  const [dal, setDal] = useState(lunediCorrente());
  const [righe, setRighe] = useState<RigaPiano[]>([]);
  const [avvisi, setAvvisi] = useState<AvvisoSovra[]>([]);
  const [membri, setMembri] = useState<Membro[]>([]);
  const [attivita, setAttivita] = useState<{ id: number; nome: string; progetto: string }[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [formAperto, setFormAperto] = useState(false);

  const al = iso(new Date(new Date(dal + "T00:00:00Z").getTime() + 27 * GIORNO_MS));

  const carica = useCallback(async () => {
    try {
      setErrore(null);
      const risposta = await api.carico(dal, al);
      setRighe(risposta.righe);
      setAvvisi(risposta.avvisi);
    } catch {
      setErrore(it.risorse.erroreCaricamento);
    }
  }, [dal, al]);

  useEffect(() => {
    void carica();
  }, [carica]);

  // attività per il form assegnazione
  useEffect(() => {
    void (async () => {
      try {
        const risposta = await api.progetti({});
        const conAttivita = await Promise.all(
          risposta.progetti.map(async p => {
            const r = await api.attivita(p.id).catch(() => ({ attivita: [] }));
            return r.attivita.map(a => ({ id: a.id, nome: a.nome, progetto: p.nome }));
          })
        );
        setAttivita(conAttivita.flat());
      } catch {
        /* il form resta vuoto; il piano è comunque visibile */
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const risposta = await api.team();
        const tutti = await Promise.all(risposta.team.map(t => api.membri(t.id).then(r => r.membri).catch(() => [])));
        setMembri(tutti.flat());
      } catch {
        /* idem */
      }
    })();
  }, []);

  const settimane = righe[0]?.carico ?? [];

  return (
    <>
      <div className="intestazione-pagina">
        <h1>
          {it.risorse.titolo} <small>{it.risorse.notaCarico}</small>
        </h1>
        <div className="filtri" role="group" aria-label={it.risorse.intervallo}>
          <button className="chip" type="button" onClick={() => setDal(sommaGiorni(dal, -7))} aria-label={it.risorse.settimanaPrecedente}>
            {it.risorse.settimanaPrecedente}
          </button>
          <span className="chip attiva">
            {dal} → {al}
          </span>
          <button className="chip" type="button" onClick={() => setDal(sommaGiorni(dal, 7))} aria-label={it.risorse.settimanaSuccessiva}>
            {it.risorse.settimanaSuccessiva}
          </button>
        </div>
        <div className="azioni">
          {attivita.length > 0 && membri.length > 0 && (
            <button className="pulsante primario" type="button" onClick={() => setFormAperto(true)}>
              {it.risorse.nuovaAssegnazione}
            </button>
          )}
        </div>
      </div>

      {errore && <p className="avviso in-ritardo" role="alert">{errore}</p>}

      {avvisi.map(a => (
        <div key={`${a.memberId}-${a.settimana}`} className="avviso in-ritardo">
          <span>⚠</span>
          <span>
            <strong>
              {a.nome} — {it.risorse.sovraAvviso} ({a.impegno}% / {a.capacita}%)
            </strong>{" "}
            nella settimana {a.settimana} — {it.risorse.sovraConsiglio}
          </span>
        </div>
      ))}

      {righe.length === 0 && !errore && (
        <div className="vuoto" aria-live="polite">
          <span className="icona" aria-hidden="true">📊</span>
          <h2>{it.risorse.nessunaAllocazione}</h2>
          <p>{it.risorse.nessunaAllocazioneTesto}</p>
          {attivita.length > 0 && membri.length > 0 && (
            <button className="pulsante primario" type="button" onClick={() => setFormAperto(true)}>
              {it.risorse.assegnaMembro}
            </button>
          )}
        </div>
      )}

      {righe.length > 0 && (
        <section className="blocco" aria-label={it.risorse.pianoTitolo} style={{ marginTop: 0 }}>
          <h2>{it.risorse.pianoTitolo}</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="dati griglia-allocazione">
              <thead>
                <tr>
                  <th scope="col">{it.risorse.colMembro}</th>
                  <th scope="col" style={{ minWidth: 220 }}>
                    {it.risorse.colAssegnazioni}
                  </th>
                  {settimane.map(s => (
                    <th scope="col" key={s.settimana}>
                      {s.settimana} — {s.inizio.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {righe.map(riga => {
                  const inSovra = riga.carico.some(c => c.sovraallocata);
                  return (
                    <tr key={riga.memberId} className={inSovra ? "riga-sovra" : ""}>
                      <td>
                        <strong>{riga.nome}</strong> <small>({riga.capacitaPunti}%)</small>
                      </td>
                      <td>
                        {riga.assegnazioni.length === 0
                          ? "—"
                          : riga.assegnazioni.map(a => (
                              <span key={a.assegnazione.id} className="tag-competenza" title={`${a.progetto} · ${a.assegnazione.percento}%`}>
                                {a.attivita} · {a.assegnazione.percento}%
                              </span>
                            ))}
                      </td>
                      {riga.carico.map(c => (
                        <td key={c.settimana} className={c.sovraallocata ? "cella-sovra" : ""}>
                          {c.impegno}%
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {righe.length > 0 && (
        <section className="blocco" aria-label={it.risorse.caricoTitolo}>
          <h2>
            {it.risorse.caricoTitolo} <small>{it.risorse.notaCarico}</small>
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table className="dati griglia-allocazione">
              <thead>
                <tr>
                  <th scope="col">{it.risorse.colMembro}</th>
                  {settimane.map(s => (
                    <th scope="col" key={s.settimana}>
                      {s.settimana}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {righe.map(riga => (
                  <tr key={riga.memberId} className={riga.carico.some(c => c.sovraallocata) ? "riga-sovra" : ""}>
                    <td>
                      <strong>{riga.nome}</strong>
                    </td>
                    {riga.carico.map(c => (
                      <td key={c.settimana} className={c.sovraallocata ? "cella-sovra" : ""}>
                        {c.impegno}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {formAperto && (
        <ModuloAssegnazione
          membri={membri}
          attivita={attivita}
          chiuso={() => setFormAperto(false)}
          creato={() => {
            setFormAperto(false);
            void carica();
          }}
        />
      )}
    </>
  );
}

function ModuloAssegnazione({
  membri,
  attivita,
  chiuso,
  creato,
}: {
  membri: Membro[];
  attivita: { id: number; nome: string; progetto: string }[];
  chiuso: () => void;
  creato: () => void;
}) {
  const [memberId, setMemberId] = useState<number>(membri[0]?.id ?? 0);
  const [taskId, setTaskId] = useState<number>(attivita[0]?.id ?? 0);
  const [percento, setPercento] = useState(50);
  const [dal, setDal] = useState("");
  const [al, setAl] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  async function sottometti(e: React.FormEvent) {
    e.preventDefault();
    setInvio(true);
    try {
      await api.creaAssegnazione(taskId, { memberId, percento, dal, al });
      creato();
    } catch (err) {
      setErrore(err instanceof ErroreApi && err.stato === 400 ? it.risorse.erroreDati : it.risorse.erroreDati);
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="velo-modale" role="dialog" aria-modal="true" aria-label={it.risorse.formTitolo}>
      <form className="modulo-creazione" onSubmit={sottometti}>
        <h2>{it.risorse.nuovaAssegnazione}</h2>
        {errore && <p className="avviso in-ritardo" role="alert">{errore}</p>}
        <label>
          {it.risorse.membro}
          <select value={memberId} onChange={e => setMemberId(Number(e.target.value))}>
            {membri.map(m => (
              <option key={m.id} value={m.id}>
                {m.nome} ({m.capacitaPunti}%)
              </option>
            ))}
          </select>
        </label>
        <label>
          {it.risorse.attivita}
          <select value={taskId} onChange={e => setTaskId(Number(e.target.value))}>
            {attivita.map(a => (
              <option key={a.id} value={a.id}>
                {a.nome} — {a.progetto}
              </option>
            ))}
          </select>
        </label>
        <label>
          {it.risorse.percento}
          <input type="number" min={1} max={100} value={percento} onChange={e => setPercento(Number(e.target.value))} required />
        </label>
        <label>
          {it.risorse.dal}
          <input type="date" value={dal} onChange={e => setDal(e.target.value)} required />
        </label>
        <label>
          {it.risorse.al}
          <input type="date" value={al} onChange={e => setAl(e.target.value)} required min={dal} />
        </label>
        <div className="azioni-forma">
          <button className="pulsante" type="button" onClick={chiuso}>
            {it.progetti.formAnnulla}
          </button>
          <button className="pulsante primario" type="submit" disabled={invio}>
            {it.risorse.aggiungi}
          </button>
        </div>
      </form>
    </div>
  );
}
