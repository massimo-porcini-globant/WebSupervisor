/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E2.1/E2.2), consumer: app.ts, gate: gate_3_implementation}
CRUD progetti (RF-01..03): validazione Zod shared (AD-5), RBAC scrittura (amm+PM), filtri e paginazione, archiviazione logica.
*/
import { and, asc, count, eq, type SQL } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { progettoCreateSchema, progettoPatchSchema, filtriProgettiSchema } from "@ws/shared";
import { requireRole } from "../plugins/rbac.js";
import { schema, type Db } from "../data/db.js";

export async function registraRouteProgetti(app: FastifyInstance, db: Db): Promise<void> {
  app.get("/progetti", { preHandler: [app.authenticate] }, async request => {
    const filtri = filtriProgettiSchema.parse(request.query);
    const condizioni: SQL[] = [];
    if (!filtri.archiviati) condizioni.push(eq(schema.projects.archiviato, false));
    if (filtri.stato) condizioni.push(eq(schema.projects.stato, filtri.stato));
    if (filtri.priorita) condizioni.push(eq(schema.projects.priorita, filtri.priorita));
    if (filtri.teamId) condizioni.push(eq(schema.projects.teamId, filtri.teamId));
    const dove = condizioni.length ? and(...condizioni) : undefined;

    const [totale] = await db.select({ valore: count() }).from(schema.projects).where(dove);
    const righe = await db
      .select()
      .from(schema.projects)
      .where(dove)
      .orderBy(asc(schema.projects.id))
      .limit(filtri.pageSize)
      .offset((filtri.page - 1) * filtri.pageSize);

    return { progetti: righe, totale: totale?.valore ?? 0, page: filtri.page, pageSize: filtri.pageSize };
  });

  app.post("/progetti", { preHandler: [requireRole(app, "amministratore", "project_manager")] }, async (request, reply) => {
    const parsed = progettoCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ errore: "Dati non validi" });
    const [progetto] = await db.insert(schema.projects).values(parsed.data).returning();
    return reply.code(201).send({ progetto });
  });

  app.get("/progetti/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const id = leggiId(request);
    if (id === null) return reply.code(400).send({ errore: "Id non valido" });
    const [progetto] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    if (!progetto) return reply.code(404).send({ errore: "Progetto non trovato" });
    return { progetto };
  });

  app.patch("/progetti/:id", { preHandler: [requireRole(app, "amministratore", "project_manager")] }, async (request, reply) => {
    const id = leggiId(request);
    if (id === null) return reply.code(400).send({ errore: "Id non valido" });
    const parsed = progettoPatchSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ errore: "Dati non validi" });
    if (Object.keys(parsed.data).length === 0) return reply.code(400).send({ errore: "Nessun campo da aggiornare" });
    const [aggiornato] = await db.update(schema.projects).set(parsed.data).where(eq(schema.projects.id, id)).returning();
    if (!aggiornato) return reply.code(404).send({ errore: "Progetto non trovato" });
    return { progetto: aggiornato };
  });

  app.post("/progetti/:id/archivia", { preHandler: [requireRole(app, "amministratore", "project_manager")] }, async (request, reply) => {
    return cambiaArchiviazione(db, request, reply, true);
  });

  app.post("/progetti/:id/ripristina", { preHandler: [requireRole(app, "amministratore", "project_manager")] }, async (request, reply) => {
    return cambiaArchiviazione(db, request, reply, false);
  });
}

function leggiId(request: FastifyRequest): number | null {
  const id = Number((request.params as { id: string }).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function cambiaArchiviazione(db: Db, request: FastifyRequest, reply: FastifyReply, archiviato: boolean) {
  const id = leggiId(request);
  if (id === null) return reply.code(400).send({ errore: "Id non valido" });
  const [progetto] = await db
    .update(schema.projects)
    .set({ archiviato })
    .where(eq(schema.projects.id, id))
    .returning();
  if (!progetto) return reply.code(404).send({ errore: "Progetto non trovato" });
  return { progetto };
}
