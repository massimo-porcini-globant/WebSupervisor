/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E9.1), consumer: server routes + client, gate: gate_3_implementation}
Schemi Zod e tipi per allocazione risorse (AD-18, RF-18..21).
*/
import { z } from "zod";

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data attesa in formato YYYY-MM-DD");

export const assegnazioneCreateSchema = z
  .object({
    memberId: z.number().int().positive(),
    percento: z.number().int().min(1).max(100),
    dal: dataIso,
    al: dataIso,
  })
  .refine(dati => dati.al >= dati.dal, {
    message: "La data di fine non può precedere la data di inizio",
    path: ["al"],
  });
export type AssegnazioneCreate = z.infer<typeof assegnazioneCreateSchema>;

export const collegaUtenteSchema = z.object({
  userId: z.number().int().positive().nullable(),
});

export interface Assegnazione {
  id: number;
  taskId: number;
  memberId: number;
  percento: number;
  dal: string;
  al: string;
}

export interface AttivitaAssegnazione {
  nome: string;
  progetto: string;
}

/** Riga del piano/carico: un membro con le sue assegnazioni e il carico settimanale (AD-19). */
export interface RigaPiano {
  memberId: number;
  nome: string;
  capacitaPunti: number;
  assegnazioni: { assegnazione: Assegnazione; attivita: string; progetto: string }[];
  carico: CaricoSettimana[];
}

export interface CaricoSettimana {
  settimana: string; // es. "W38"
  inizio: string; // ISO lunedì
  fine: string; // ISO domenica
  impegno: number; // % rapportata alla capacità
  sovraallocata: boolean;
}

export interface AvvisoSovra {
  memberId: number;
  nome: string;
  settimana: string;
  impegno: number;
  capacita: number;
}
