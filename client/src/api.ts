/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E2.3), consumer: componenti client, gate: gate_3_implementation}
Client API: fetch con cookie di sessione (httpOnly) e gestione errori uniforme.
*/
import type {
  Utente,
  Progetto,
  FiltriProgetti,
  ProgettoConAvanzamento,
  KpiProgetto,
  Gantt,
  Attivita,
  TeamConMembri,
  Membro,
  Assenza,
} from "@ws/shared";

export class ErroreApi extends Error {
  constructor(
    public stato: number,
    messaggio: string
  ) {
    super(messaggio);
  }
}

async function chiama<T>(percorso: string, opzioni: RequestInit = {}): Promise<T> {
  const risposta = await fetch(`/api/v1${percorso}`, {
    credentials: "same-origin",
    headers: opzioni.body ? { "content-type": "application/json" } : undefined,
    ...opzioni,
  });
  if (!risposta.ok) {
    const corpo = (await risposta.json().catch(() => ({}))) as { errore?: string };
    throw new ErroreApi(risposta.status, corpo.errore ?? "Errore inatteso");
  }
  return risposta.json() as Promise<T>;
}

export const api = {
  me: () => chiama<{ utente: Utente }>("/auth/me"),
  login: (username: string, password: string) =>
    chiama<{ utente: Utente }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => chiama<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  progetti: (filtri: Partial<FiltriProgetti>) => {
    const parametri = new URLSearchParams();
    for (const [chiave, valore] of Object.entries(filtri)) {
      if (valore !== undefined && valore !== null) parametri.set(chiave, String(valore));
    }
    const query = parametri.toString();
    return chiama<{ progetti: ProgettoConAvanzamento[]; totale: number; page: number; pageSize: number }>(
      `/progetti${query ? `?${query}` : ""}`
    );
  },
  creaProgetto: (corpo: unknown) =>
    chiama<{ progetto: Progetto }>("/progetti", { method: "POST", body: JSON.stringify(corpo) }),
  kpiProgetto: (idProgetto: number) => chiama<{ kpi: KpiProgetto }>(`/progetti/${idProgetto}/kpi`),
  gantt: (idProgetto: number) => chiama<Gantt>(`/progetti/${idProgetto}/gantt`),
  aggiornaAttivita: (id: number, patch: Record<string, unknown>) =>
    chiama<{ attivita: Attivita }>(`/attivita/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  aggiungiDipendenza: (id: number, dependsOn: number) =>
    chiama<{ dipendenza: unknown }>(`/attivita/${id}/dipendenze`, { method: "POST", body: JSON.stringify({ dependsOn }) }),
  rimuoviDipendenza: (id: number, dependsOn: number) =>
    chiama<{ ok: boolean }>(`/attivita/${id}/dipendenze/${dependsOn}`, { method: "DELETE" }),
  team: () => chiama<{ team: TeamConMembri[] }>("/team"),
  creaTeam: (nome: string) => chiama<{ team: { id: number; nome: string } }>("/team", { method: "POST", body: JSON.stringify({ nome }) }),
  membri: (idTeam: number) => chiama<{ membri: Membro[] }>(`/team/${idTeam}/membri`),
  creaMembro: (idTeam: number, corpo: Record<string, unknown>) =>
    chiama<{ membro: Membro }>(`/team/${idTeam}/membri`, { method: "POST", body: JSON.stringify(corpo) }),
  aggiornaMembro: (id: number, patch: Record<string, unknown>) =>
    chiama<{ membro: Membro }>(`/membri/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  rimuoviMembro: (id: number) => chiama<{ ok: boolean; assegnazioniRimosse: number }>(`/membri/${id}`, { method: "DELETE" }),
  assenze: (idMembro: number) => chiama<{ assenze: Assenza[] }>(`/membri/${idMembro}/assenze`),
  creaAssenza: (idMembro: number, corpo: Record<string, unknown>) =>
    chiama<{ assenza: Assenza }>(`/membri/${idMembro}/assenze`, { method: "POST", body: JSON.stringify(corpo) }),
  rimuoviAssenza: (id: number) => chiama<{ ok: boolean }>(`/assenze/${id}`, { method: "DELETE" }),
};
