/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.1), consumer: client/server, gate: gate_3_implementation}
Contratto condiviso client/server: ruoli, tipi utente.
*/
export const RUOLI = ["amministratore", "project_manager", "membro", "osservatore"] as const;
export type Ruolo = (typeof RUOLI)[number];

export interface Utente {
  id: number;
  username: string;
  ruolo: Ruolo;
}

export interface LoginResponse {
  utente: Utente;
}
