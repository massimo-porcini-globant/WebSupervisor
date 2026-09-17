/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E3.1/E3.3), consumer: server routes + client, gate: gate_3_implementation}
Schemi Zod condivisi per attività, dipendenze e KPI (AD-5).
*/
import { z } from "zod";

export const STATI_TASK = ["da-iniziare", "in-corso", "completata", "in-ritardo"] as const;

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data attesa in formato YYYY-MM-DD");

export const statoTaskSchema = z.enum(["da-iniziare", "in-corso", "completata", "in-ritardo"]);

export const attivitaBaseObject = z.object({
  nome: z.string().trim().min(1).max(120),
  fase: z.string().trim().max(80).optional().nullable(),
  inizio: dataIso,
  fine: dataIso,
  stato: statoTaskSchema.default("da-iniziare"),
  stimaOre: z.number().int().min(0).max(10_000).optional().nullable(),
  lavorateOre: z.number().int().min(0).max(100_000).optional(),
});

export const attivitaCreateSchema = attivitaBaseObject.refine(dati => dati.fine >= dati.inizio, {
  message: "La data di fine non può precedere la data di inizio",
  path: ["fine"],
});
export type AttivitaCreate = z.infer<typeof attivitaCreateSchema>;

export const attivitaPatchSchema = attivitaBaseObject
  .partial()
  .refine(dati => dati.fine === undefined || dati.inizio === undefined || dati.fine >= dati.inizio, {
    message: "La data di fine non può precedere la data di inizio",
    path: ["fine"],
  });
export type AttivitaPatch = z.infer<typeof attivitaPatchSchema>;

export const attivitaPatchMembroSchema = attivitaBaseObject
  .pick({ stato: true, lavorateOre: true })
  .refine(dati => Object.keys(dati).length > 0, { message: "Nessun campo da aggiornare" });

export const dipendenzaSchema = z.object({ dependsOn: z.number().int().positive() });

export const filtriAttivitaSchema = z.object({
  stato: statoTaskSchema.optional(),
  fase: z.string().trim().max(80).optional(),
});

export interface Attivita {
  id: number;
  projectId: number;
  nome: string;
  fase: string | null;
  inizio: string;
  fine: string;
  stato: (typeof STATI_TASK)[number];
  stimaOre: number | null;
  lavorateOre: number | null;
}

export interface Dipendenza {
  taskId: number;
  dependsOn: number;
}

export interface KpiProgetto {
  completate: number;
  inCorso: number;
  daIniziare: number;
  inRitardo: number;
  scadenzeProssime: { id: number; nome: string; fine: string; stato: (typeof STATI_TASK)[number] }[];
}

export interface ProgettoConAvanzamento {
  id: number;
  nome: string;
  descrizione: string | null;
  priorita: "alta" | "media" | "bassa";
  stato: "in-linea" | "a-rischio" | "in-ritardo";
  inizio: string;
  fine: string;
  teamId: number | null;
  archiviato: boolean;
  avanzamento: number | null;
  suggerimentoStato: "in-linea" | "a-rischio" | "in-ritardo";
}
