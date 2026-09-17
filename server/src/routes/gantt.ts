/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E4.1), consumer: app.ts, gate: gate_3_implementation}
API gantt (RF-08): attività con flag criticità CPM (AD-7) + dipendenze + metadati. Server-side come da AD-7.
*/
import { eq, inArray } from "drizzle-orm";import type { FastifyInstance } from "fastify";
import { calcolaCpm } from "../domain/cpm.js";
import { schema, type Db } from "../data/db.js";

export async function registraRouteGantt(app: FastifyInstance, db: Db): Promise<void> {
  app.get("/progetti/:idProgetto/gantt", { preHandler: [app.authenticate] }, async (request, reply) => {
    const idProgetto = Number((request.params as { idProgetto: string }).idProgetto);
    if (!Number.isInteger(idProgetto) || idProgetto <= 0) return reply.code(400).send({ errore: "Id progetto non valido" });
    const [progetto] = await db.select().from(schema.projects).where(eq(schema.projects.id, idProgetto));
    if (!progetto) return reply.code(404).send({ errore: "Progetto non trovato" });

    const attivita = await db.select().from(schema.tasks).where(eq(schema.tasks.projectId, idProgetto));
    const ids = attivita.map(a => a.id);
    const dipendenze =
      attivita.length === 0
        ? []
        : await db
            .select()
            .from(schema.taskDependencies)
            .where(inArray(schema.taskDependencies.taskId, ids));

    const cpm = calcolaCpm(
      attivita.map(a => ({ id: a.id, inizio: a.inizio, fine: a.fine })),
      dipendenze
    );

    return {
      attivita: attivita.map(a => ({ ...a, critica: cpm.nodi.get(a.id)?.critica ?? false })),
      dipendenze,
      cpm: {
        fineProgetto: cpm.fineProgetto,
        critiche: [...cpm.nodi.values()].filter(n => n.critica).length,
      },
    };
  });
}
