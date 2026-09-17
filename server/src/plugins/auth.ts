/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.3), consumer: app.ts, gate: gate_3_implementation}
Plugin JWT (AD-2): firma HS256, cookie httpOnly, decoratore authenticate.
*/
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const COOKIE_JWT = "ws_token";
export const JWT_TTL = "8h";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: number; ruolo: string };
    user: { sub: number; ruolo: string };
  }
}

export async function registraAuth(app: FastifyInstance, segreto: string): Promise<void> {
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, { secret: segreto, cookie: { cookieName: COOKIE_JWT, signed: false } });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify({ onlyCookie: true });
    } catch {
      await reply.code(401).send({ errore: "Non autenticato" });
    }
  });
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
