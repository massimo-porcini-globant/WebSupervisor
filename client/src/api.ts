/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E2.3), consumer: componenti client, gate: gate_3_implementation}
Client API: fetch con cookie di sessione (httpOnly) e gestione errori uniforme.
*/
import type { Utente, Progetto, FiltriProgetti } from "@ws/shared";

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
    return chiama<{ progetti: Progetto[]; totale: number; page: number; pageSize: number }>(
      `/progetti${query ? `?${query}` : ""}`
    );
  },
  creaProgetto: (corpo: unknown) =>
    chiama<{ progetto: Progetto }>("/progetti", { method: "POST", body: JSON.stringify(corpo) }),
};
