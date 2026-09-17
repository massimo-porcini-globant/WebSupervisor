/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.3/E1.4), consumer: server routes + client forms, gate: gate_3_implementation}
Schemi Zod condivisi per autenticazione (AD-5).
*/
import { z } from "zod";
import { RUOLI } from "../types/index.js";

export const loginSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const ruoloSchema = z.enum(RUOLI);

export const utenteSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  ruolo: ruoloSchema,
});
export type UtenteOutput = z.infer<typeof utenteSchema>;
