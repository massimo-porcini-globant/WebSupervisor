/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.3), consumer: app.ts, gate: gate_3_implementation}
Route autenticazione: login (bcrypt + JWT cookie httpOnly), logout, me. 401 generico anti-enumeration.
*/
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { loginSchema, utenteSchema } from "@ws/shared";
import { COOKIE_JWT, JWT_TTL } from "../plugins/auth.js";
import { schema } from "../data/db.js";
import type { Db } from "../data/db.js";

export async function registraRouteAuth(app: FastifyInstance, db: Db): Promise<void> {
  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ errore: "Dati non validi" });
    }
    const { username, password } = parsed.data;

    const [utente] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    if (!utente || !utente.attivo) {
      return reply.code(401).send({ errore: "Credenziali non valide" });
    }
    const ok = await bcrypt.compare(password, utente.passwordHash);
    if (!ok) {
      return reply.code(401).send({ errore: "Credenziali non valide" });
    }

    const token = await reply.jwtSign({ sub: utente.id, ruolo: utente.ruolo }, { expiresIn: JWT_TTL });
    reply.setCookie(COOKIE_JWT, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return reply.send({
      utente: utenteSchema.parse({ id: utente.id, username: utente.username, ruolo: utente.ruolo }),
    });
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(COOKIE_JWT, { path: "/" });
    return reply.send({ ok: true });
  });

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const [utente] = await db.select().from(schema.users).where(eq(schema.users.id, request.user.sub));
    if (!utente) return reply.code(401).send({ errore: "Non autenticato" });
    return reply.send({
      utente: utenteSchema.parse({ id: utente.id, username: utente.username, ruolo: utente.ruolo }),
    });
  });
}
