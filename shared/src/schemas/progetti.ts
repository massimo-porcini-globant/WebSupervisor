/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E2.1/E2.2), consumer: server routes + client forms, gate: gate_3_implementation}
Schemi Zod condivisi per progetti (AD-5).
*/
import { z } from "zod";

export const PRIORITA = ["alta", "media", "bassa"] as const;
export const STATI_PROGETTO = ["in-linea", "a-rischio", "in-ritardo"] as const;

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data attesa in formato YYYY-MM-DD");

export const progettoBaseObject = z.object({
  nome: z.string().trim().min(1).max(120),
  descrizione: z.string().trim().max(2000).optional().nullable(),
  priorita: z.enum(["alta", "media", "bassa"]),
  stato: z.enum(["in-linea", "a-rischio", "in-ritardo"]).default("in-linea"),
  inizio: dataIso,
  fine: dataIso,
  teamId: z.number().int().positive().optional().nullable(),
});

export const progettoCreateSchema = progettoBaseObject.refine(dati => dati.fine >= dati.inizio, {
  message: "La data di fine non può precedere la data di inizio",
  path: ["fine"],
});
export type ProgettoCreate = z.infer<typeof progettoCreateSchema>;

export const progettoPatchSchema = progettoBaseObject.partial().refine(
  dati => dati.fine === undefined || dati.inizio === undefined || dati.fine >= dati.inizio,
  { message: "La data di fine non può precedere la data di inizio", path: ["fine"] }
);
export type ProgettoPatch = z.infer<typeof progettoPatchSchema>;

export const filtriProgettiSchema = z.object({
  stato: z.enum(["in-linea", "a-rischio", "in-ritardo"]).optional(),
  priorita: z.enum(["alta", "media", "bassa"]).optional(),
  teamId: z.coerce.number().int().positive().optional(),
  archiviati: z
    .enum(["true", "false"])
    .default("false")
    .transform(v => v === "true"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type FiltriProgetti = z.infer<typeof filtriProgettiSchema>;

export interface Progetto {
  id: number;
  nome: string;
  descrizione: string | null;
  priorita: (typeof PRIORITA)[number];
  stato: (typeof STATI_PROGETTO)[number];
  inizio: string;
  fine: string;
  teamId: number | null;
  archiviato: boolean;
}
