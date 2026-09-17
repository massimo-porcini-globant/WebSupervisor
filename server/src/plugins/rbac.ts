/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.4), consumer: routes protette, gate: gate_3_implementation}
Middleware RBAC (ASD F03 §3): requireRole(...) su route di scrittura; 401 non autenticato, 403 ruolo insufficiente.
*/
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Ruolo } from "@ws/shared";

export function requireRole(app: FastifyInstance, ...ruoliConsentiti: Ruolo[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await app.authenticate(request, reply);
    if (reply.sent) return;
    const ruolo = request.user?.ruolo as Ruolo | undefined;
    if (!ruolo || !ruoliConsentiti.includes(ruolo)) {
      await reply.code(403).send({ errore: "Permessi insufficienti" });
    }
  };
}
