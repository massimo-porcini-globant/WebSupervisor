/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E5.4), consumer: App, gate: gate_3_implementation}
Schermata Team conforme M3 (F01): selettore team, griglia card membri (avatar, ruolo, competenze,
capacità), assenze programmate (RF-14..16), stato vuoto, modale membro/assenza/nuovo team.
*/
import { useCallback, useEffect, useState } from "react";
import { it, type Utente, type TeamConMembri, type Membro, type Assenza } from "@ws/shared";
import { api, ErroreApi } from "../api.js";

const TINTE = ["#1F5F8B", "#2E7D4F", "#8A5A10", "#5A4B8A", "#B3382C"];

function formattaPeriodo(dal: string, al: string): string {
  return dal === al ? dal : `${dal} → ${al}`;
}

export default function SchermataTeam({ utente }: { utente: Utente }) {
  const [team, setTeam] = useState<TeamConMembri[]>([]);
  const [idTeam, setIdTeam] = useState<number | null>(null);
  const [membri, setMembri] = useState<Membro[]>([]);
  const [assenze, setAssenze] = useState<Assenza[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [moduloTeamAperto, setModuloTeamAperto] = useState(false);
  const [membroInEditing, setMembroInEditing] = useState<Membro | null>(null);
  const [moduloMembroAperto, setModuloMembroAperto] = useState(false);
  const [moduloAssenzaAperto, setModuloAssenzaAperto] = useState(false);

  const puoScrivere = utente.ruolo === "amministratore" || utente.ruolo === "project_manager";

  const caricaTeam = useCallback(async () => {
    try {
      setErrore(null);
      const risposta = await api.team();
      setTeam(risposta.team);
      setIdTeam(prima => prima ?? risposta.team[0]?.id ?? null);
    } catch {
      setErrore(it.team.erroreCaricamento);
    }
  }, []);

  const caricaMembri = useCallback(async () => {
    if (idTeam === null) {
      setMembri([]);
      setAssenze([]);
      return;
    }
    try {
      const risposta = await api.membri(idTeam);
      setMembri(risposta.membri);
      const tutte = await Promise.all(risposta.membri.map(m => api.assenze(m.id).then(r => r.assenze).catch(() => [])));
      setAssenze(tutte.flat());
    } catch {
      setErrore(it.team.erroreCaricamento);
    }
  }, [idTeam]);

  useEffect(() => {
    void caricaTeam();
  }, [caricaTeam]);

  useEffect(() => {
    void caricaMembri();
  }, [caricaMembri]);

  const nomeMembro = (id: number) => membri.find(m => m.id === id)?.nome ?? String(id);
  const selezionato = team.find(t => t.id === idTeam) ?? null;
  const vuoto = team.length === 0;
  const nessunMembro = selezionato !== null && membri.length === 0;

  return (
    <>
      <div className="intestazione-pagina">
        <h1>{it.team.titolo}</h1>
        {!vuoto && (
          <label className="campo-progetto">
            {it.team.scegliTeam}
            <select value={idTeam ?? ""} onChange={e => setIdTeam(Number(e.target.value))}>
              {team.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="azioni">
          {puoScrivere && (
            <button className="pulsante" type="button" onClick={() => setModuloTeamAperto(true)}>
              {it.team.nuovoTeam}
            </button>
          )}
          {!vuoto && puoScrivere && (
            <button className="pulsante primario" type="button" onClick={() => { setMembroInEditing(null); setModuloMembroAperto(true); }}>
              {it.team.aggiungiMembro}
            </button>
          )}
        </div>
      </div>

      {errore && <p className="avviso in-ritardo" role="alert">{errore}</p>}

      {vuoto && (
        <div className="vuoto" aria-live="polite">
          <span className="icona" aria-hidden="true">👥</span>
          <h2>{it.team.nessunTeam}</h2>
          <p>{it.team.nessunTeamTesto}</p>
          <button className="pulsante primario" type="button" onClick={() => setModuloTeamAperto(true)}>
            {it.team.nuovoTeam}
          </button>
        </div>
      )}

      {!vuoto && nessunMembro && (
        <div className="vuoto" aria-live="polite">
          <span className="icona" aria-hidden="true">🧑</span>
          <h2>{it.team.nessunMembro}</h2>
          <p>{it.team.nessunMembroTesto}</p>
          <button className="pulsante primario" type="button" onClick={() => { setMembroInEditing(null); setModuloMembroAperto(true); }}>
            {it.team.primoMembro}
          </button>
        </div>
      )}

      {!vuoto && membri.length > 0 && selezionato && (
        <>
          <section className="blocco" aria-label={it.team.membriTitolo} style={{ marginTop: 0 }}>
            <h2>
              {it.team.membriTitolo}{" "}
              <small>
                {membri.length} {it.team.membriTitolo.toLowerCase()} — {it.team.capacitaComplessiva} {selezionato.capacita}%
              </small>
            </h2>
            <div className="griglia-membri">
              {membri.map(m => (
                <div key={m.id} className="scheda-membro">
                  <div className="avatar" style={{ background: TINTE[m.id % TINTE.length] }}>
                    {m.nome.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="corpo">
                    <div className="riga-nome">
                      <strong>{m.nome}</strong>
                      <span className="ruolo">{m.ruolo}</span>
                    </div>
                    <div className="email">{m.email}</div>
                    {m.competenze && (
                      <div className="competenze">
                        {m.competenze.split(",").map(c => (
                          <span key={c.trim()} className="tag-competenza">
                            {c.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="disponibilita">
                      <span>{it.team.disponibilita}</span>
                      <div className="traccia">
                        <div className="riempimento" style={{ width: `${Math.min(100, m.capacitaPunti)}%` }} />
                      </div>
                      <strong>{m.capacitaPunti}%</strong>
                    </div>
                    <div className="azioni-scheda">
                      <button className="pulsante pulsante-chiaro" type="button" onClick={() => { setMembroInEditing(m); setModuloMembroAperto(true); }}>
                        {it.team.modifica}
                      </button>
                      <button
                        className="pulsante pulsante-chiaro"
                        type="button"
                        onClick={() => {
                          if (!window.confirm(it.team.confermaRimozione)) return;
                          void api.rimuoviMembro(m.id).then(() => caricaMembri());
                        }}
                      >
                        {it.team.rimuovi}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="blocco" aria-label={it.team.assenzeTitolo}>
            <h2>{it.team.assenzeTitolo}</h2>
            {assenze.length === 0 ? (
              <p className="scadenze-vuoto">{it.team.assenzeNessuna}</p>
            ) : (
              <table className="dati">
                <thead>
                  <tr>
                    <th scope="col">{it.team.colMembro}</th>
                    <th scope="col">{it.team.colPeriodo}</th>
                    <th scope="col">{it.team.colMotivo}</th>
                    <th scope="col">{it.team.colImpatto}</th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {assenze.map(a => (
                    <tr key={a.id}>
                      <td>
                        <strong>{nomeMembro(a.memberId)}</strong>
                      </td>
                      <td className="data">{formattaPeriodo(a.dal, a.al)}</td>
                      <td>{a.motivo}</td>
                      <td>{a.impattoPercento}%</td>
                      <td>
                        <button className="pulsante pulsante-chiaro" type="button" onClick={() => void api.rimuoviAssenza(a.id).then(() => caricaMembri())}>
                          {it.team.rimuovi}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="azioni">
              <button className="pulsante" type="button" onClick={() => setModuloAssenzaAperto(true)}>
                {it.team.aggiungiAssenza}
              </button>
            </div>
          </section>
        </>
      )}

      {moduloTeamAperto && (
        <ModuloNuovoTeam
          chiuso={() => setModuloTeamAperto(false)}
          creato={id => {
            setModuloTeamAperto(false);
            void caricaTeam().then(() => setIdTeam(id));
          }}
        />
      )}
      {moduloMembroAperto && selezionato && (
        <ModuloMembro
          idTeam={selezionato.id}
          membro={membroInEditing}
          chiuso={() => setModuloMembroAperto(false)}
          creato={() => {
            setModuloMembroAperto(false);
            void caricaMembri();
          }}
        />
      )}
      {moduloAssenzaAperto && membri.length > 0 && (
        <ModuloAssenza
          membri={membri}
          chiuso={() => setModuloAssenzaAperto(false)}
          creato={() => {
            setModuloAssenzaAperto(false);
            void caricaMembri();
          }}
          errore={setErrore}
        />
      )}
    </>
  );
}

function ModuloNuovoTeam({ chiuso, creato }: { chiuso: () => void; creato: (id: number) => void }) {
  const [nome, setNome] = useState("");
  const [errore, setErrore] = useState<string | null>(null);

  async function sottometti(e: React.FormEvent) {
    e.preventDefault();
    try {
      const risposta = await api.creaTeam(nome.trim());
      creato(risposta.team.id);
    } catch (err) {
      setErrore(err instanceof ErroreApi && err.stato === 409 ? "Esiste già un team con questo nome" : it.team.erroreDati);
    }
  }

  return (
    <div className="velo-modale" role="dialog" aria-modal="true" aria-label={it.team.nuovoTeam}>
      <form className="modulo-creazione" onSubmit={sottometti}>
        <h2>{it.team.nuovoTeam}</h2>
        {errore && <p className="avviso in-ritardo" role="alert">{errore}</p>}
        <label>
          {it.team.nomeTeam}
          <input value={nome} onChange={e => setNome(e.target.value)} required maxLength={80} />
        </label>
        <div className="azioni-forma">
          <button className="pulsante" type="button" onClick={chiuso}>
            {it.progetti.formAnnulla}
          </button>
          <button className="pulsante primario" type="submit">
            {it.team.crea}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModuloMembro({ idTeam, membro, chiuso, creato }: { idTeam: number; membro: Membro | null; chiuso: () => void; creato: () => void }) {
  const [nome, setNome] = useState(membro?.nome ?? "");
  const [ruolo, setRuolo] = useState(membro?.ruolo ?? "");
  const [email, setEmail] = useState(membro?.email ?? "");
  const [competenze, setCompetenze] = useState(membro?.competenze ?? "");
  const [capacitaPunti, setCapacitaPunti] = useState(membro?.capacitaPunti ?? 100);
  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  async function sottometti(e: React.FormEvent) {
    e.preventDefault();
    setInvio(true);
    setErrore(null);
    const corpo = {
      nome: nome.trim(),
      ruolo: ruolo.trim(),
      email: email.trim(),
      competenze: competenze.trim() || undefined,
      capacitaPunti,
    };
    try {
      if (membro) await api.aggiornaMembro(membro.id, corpo);
      else await api.creaMembro(idTeam, corpo);
      creato();
    } catch {
      setErrore(it.team.erroreDati);
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="velo-modale" role="dialog" aria-modal="true" aria-label={it.team.membroFormTitolo}>
      <form className="modulo-creazione" onSubmit={sottometti}>
        <h2>{it.team.membroFormTitolo}</h2>
        {errore && <p className="avviso in-ritardo" role="alert">{errore}</p>}
        <label>
          {it.team.membroNome}
          <input value={nome} onChange={e => setNome(e.target.value)} required maxLength={120} />
        </label>
        <label>
          {it.team.membroRuolo}
          <input value={ruolo} onChange={e => setRuolo(e.target.value)} required maxLength={80} />
        </label>
        <label>
          {it.team.membroEmail}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={200} />
        </label>
        <label>
          {it.team.membroCompetenze}
          <input value={competenze} onChange={e => setCompetenze(e.target.value)} maxLength={400} />
        </label>
        <label>
          {it.team.membroCapacita}
          <input type="number" min={1} max={200} value={capacitaPunti} onChange={e => setCapacitaPunti(Number(e.target.value))} required />
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

function ModuloAssenza({
  membri,
  chiuso,
  creato,
  errore,
}: {
  membri: Membro[];
  chiuso: () => void;
  creato: () => void;
  errore: (messaggio: string) => void;
}) {
  const [memberId, setMemberId] = useState(membri[0]?.id ?? 0);
  const [dal, setDal] = useState("");
  const [al, setAl] = useState("");
  const [motivo, setMotivo] = useState("");
  const [impattoPercento, setImpattoPercento] = useState(100);

  async function sottometti(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.creaAssenza(memberId, { dal, al, motivo: motivo.trim(), impattoPercento });
      creato();
    } catch (err) {
      errore(
        err instanceof ErroreApi && err.stato === 400 && (err.message.includes("sovrappone") || err.message.includes("non validi"))
          ? err.message.includes("sovrappone")
            ? it.team.erroreSovrapposta
            : it.team.erroreDati
          : it.team.erroreDati
      );
    }
  }

  return (
    <div className="velo-modale" role="dialog" aria-modal="true" aria-label={it.team.aggiungiAssenza}>
      <form className="modulo-creazione" onSubmit={sottometti}>
        <h2>{it.team.aggiungiAssenza}</h2>
        <label>
          {it.team.colMembro}
          <select value={memberId} onChange={e => setMemberId(Number(e.target.value))}>
            {membri.map(m => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          {it.team.assenzaDal}
          <input type="date" value={dal} onChange={e => setDal(e.target.value)} required />
        </label>
        <label>
          {it.team.assenzaAl}
          <input type="date" value={al} onChange={e => setAl(e.target.value)} required min={dal} />
        </label>
        <label>
          {it.team.assenzaMotivo}
          <input value={motivo} onChange={e => setMotivo(e.target.value)} required maxLength={120} />
        </label>
        <label>
          {it.team.assenzaImpatto}
          <input type="number" min={0} max={100} value={impattoPercento} onChange={e => setImpattoPercento(Number(e.target.value))} />
        </label>
        <div className="azioni-forma">
          <button className="pulsante" type="button" onClick={chiuso}>
            {it.progetti.formAnnulla}
          </button>
          <button className="pulsante primario" type="submit">
            {it.progetti.formCrea}
          </button>
        </div>
      </form>
    </div>
  );
}
