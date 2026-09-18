/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E5.1), consumer: server routes + client, gate: gate_3_implementation}
Schemi Zod condivisi per team, membri e assenze (AD-9, RF-14..16).
*/
import { z } from "zod";

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data attesa in formato YYYY-MM-DD");

export const teamCreateSchema = z.object({
  nome: z.string().trim().min(1).max(80),
});
export type TeamCreate = z.infer<typeof teamCreateSchema>;

export const membroCreateSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  ruolo: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  competenze: z.string().trim().max(400).optional().nullable(),
  capacitaPunti: z.number().int().min(1).max(200).optional(),
});
export type MembroCreate = z.infer<typeof membroCreateSchema>;

export const membroPatchSchema = membroCreateSchema.partial();
export type MembroPatch = z.infer<typeof membroPatchSchema>;

export const assenzaCreateSchema = z
  .object({
    dal: dataIso,
    al: dataIso,
    motivo: z.string().trim().min(1).max(120),
    impattoPercento: z.number().int().min(0).max(100).optional(),
  })
  .refine(dati => dati.al >= dati.dal, {
    message: "La data di fine non può precedere la data di inizio",
    path: ["al"],
  });
export type AssenzaCreate = z.infer<typeof assenzaCreateSchema>;

export interface Team {
  id: number;
  nome: string;
}

export interface TeamConMembri extends Team {
  membri: number;
  capacita: number;
}

export interface Membro {
  id: number;
  nome: string;
  ruolo: string;
  email: string;
  competenze: string | null;
  capacitaPunti: number;
  teamId: number | null;
  userId: number | null;
}

export interface Assenza {
  id: number;
  memberId: number;
  dal: string;
  al: string;
  motivo: string;
  impattoPercento: number;
}
