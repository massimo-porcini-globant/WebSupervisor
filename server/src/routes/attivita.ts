/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E3.1/E3.2), consumer: app.ts, gate: gate_3_implementation}
CRUD attività + dipendenze con anti-ciclo (dominio). RBAC: scrittura amm+PM; membro assegnato solo stato+lavorateOre.
*/
import { and, asc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  attivitaCreateSchema,
  attivitaPatchSchema,
  attivitaPatchMembroSchema,
  dipendenzaSchema,
  type AttivitaPatch,
} from "@ws/shared";
import { requireRole } from "../plugins/rbac.js";
import { rilevaCiclo, calcolaKpiProgetto } from "../domain/attivita.js";
import { schema, type Db } from "../data/db.js";

type UtenteToken = { sub: number; ruolo: string };

export async function registraRouteAttivita(app: FastifyInstance, db: Db): Promise<void> {
  const ruoliScrittura = ["amministratore", "project_manager"] as const;

  app.get("/progetti/:idProgetto/attivita", { preHandler: [app.authenticate] }, async (request, reply) => {
    const idProgetto = leggiId(request, "idProgetto");
    if (idProgetto === null) return reply.code(400).send({ errore: "Id progetto non valido" });
    const [progetto] = await db.select().from(schema.projects).where(eq(schema.projects.id, idProgetto));
    if (!progetto) return reply.code(404).send({ errore: "Progetto non trovato" });

    const attivita = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, idProgetto))
      .orderBy(asc(schema.tasks.id));
    const dipendenze = await elencoDipendenze(db, attivita.map(a => a.id));
    return { attivita, dipendenze };
  });

  app.post("/progetti/:idProgetto/attivita", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const idProgetto = leggiId(request, "idProgetto");
    if (idProgetto === null) return reply.code(400).send({ errore: "Id progetto non valido" });
    const [progetto] = await db.select().from(schema.projects).where(eq(schema.projects.id, idProgetto));
    if (!progetto) return reply.code(404).send({ errore: "Progetto non trovato" });

    const parsed = attivitaCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ errore: "Dati non validi" });
    const [attivita] = await db.insert(schema.tasks).values({ ...parsed.data, projectId: idProgetto }).returning();
    return reply.code(201).send({ attivita });
  });

  app.patch("/attivita/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const id = leggiId(request, "id");
    if (id === null) return reply.code(400).send({ errore: "Id attività non valido" });
    const [attivita] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    if (!attivita) return reply.code(404).send({ errore: "Attività non trovata" });

    const utente = (request.user as UtenteToken) ?? null;
    const corpo = (request.body ?? {}) as Record<string, unknown>;

    if (utente && (utente.ruolo === "amministratore" || utente.ruolo === "project_manager")) {
      const parsed = attivitaPatchSchema.safeParse(corpo);
      if (!parsed.success) return reply.code(400).send({ errore: "Dati non validi" });
      if (Object.keys(corpo).length === 0) return reply.code(400).send({ errore: "Nessun campo da aggiornare" });
      const [aggiornata] = await db.update(schema.tasks).set(parsed.data).where(eq(schema.tasks.id, id)).returning();
      return { attivita: aggiornata };
    }

    if (utente && utente.ruolo === "membro") {
      const assegnata = await membroAssegnato(db, id, utente.sub);
      if (!assegnata) return reply.code(403).send({ errore: "Permessi insufficienti" });
      const campiConsentiti: (keyof AttivitaPatch)[] = ["stato", "lavorateOre"];
      const chiavi = Object.keys(corpo);
      if (chiavi.length === 0) return reply.code(400).send({ errore: "Nessun campo da aggiornare" });
      if (chiavi.some(k => !campiConsentiti.includes(k as keyof AttivitaPatch))) {
        return reply.code(403).send({ errore: "Puoi aggiornare solo stato e ore lavorate" });
      }
      const parsed = attivitaPatchMembroSchema.safeParse(corpo);
      if (!parsed.success) return reply.code(400).send({ errore: "Dati non validi" });
      const [aggiornata] = await db.update(schema.tasks).set(parsed.data).where(eq(schema.tasks.id, id)).returning();
      return { attivita: aggiornata };
    }

    return reply.code(403).send({ errore: "Permessi insufficienti" });
  });

  app.delete("/attivita/:id", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = leggiId(request, "id");
    if (id === null) return reply.code(400).send({ errore: "Id attività non valido" });
    await db.delete(schema.taskDependencies).where(eq(schema.taskDependencies.taskId, id));
    await db.delete(schema.taskDependencies).where(eq(schema.taskDependencies.dependsOn, id));
    const [cancellata] = await db.delete(schema.tasks).where(eq(schema.tasks.id, id)).returning();
    if (!cancellata) return reply.code(404).send({ errore: "Attività non trovata" });
    return { ok: true };
  });

  app.post("/attivita/:id/dipendenze", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = leggiId(request, "id");
    if (id === null) return reply.code(400).send({ errore: "Id attività non valido" });
    const parsed = dipendenzaSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ errore: "Dati non validi" });
    const dependsOn = parsed.data.dependsOn;

    const [target] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    const [prereq] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, dependsOn));
    if (!target || !prereq) return reply.code(404).send({ errore: "Attività non trovata" });
    if (target.projectId !== prereq.projectId) return reply.code(400).send({ errore: "Le attività devono appartenere allo stesso progetto" });

    const archi = await db
      .select()
      .from(schema.taskDependencies)
      .where(inArray(schema.taskDependencies.taskId, await db.select({ id: schema.tasks.id }).from(schema.tasks).where(eq(schema.tasks.projectId, target.projectId)).then(righe => righe.map(r => r.id))));
    if (rilevaCiclo(id, dependsOn, archi)) return reply.code(400).send({ errore: "La dipendenza creerebbe un ciclo" });

    await db.insert(schema.taskDependencies).values({ taskId: id, dependsOn }).onConflictDoNothing();
    return reply.code(201).send({ dipendenza: { taskId: id, dependsOn } });
  });

  app.delete("/attivita/:id/dipendenze/:dependsOn", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = leggiId(request, "id");
    const dependsOn = Number((request.params as { dependsOn: string }).dependsOn);
    if (id === null || !Number.isInteger(dependsOn) || dependsOn <= 0) {
      return reply.code(400).send({ errore: "Parametri non validi" });
    }
    const [rimossa] = await db
      .delete(schema.taskDependencies)
      .where(and(eq(schema.taskDependencies.taskId, id), eq(schema.taskDependencies.dependsOn, dependsOn)))
      .returning();
    if (!rimossa) return reply.code(404).send({ errore: "Dipendenza non trovata" });
    return { ok: true };
  });

  app.get("/progetti/:idProgetto/kpi", { preHandler: [app.authenticate] }, async (request, reply) => {
    const idProgetto = leggiId(request, "idProgetto");
    if (idProgetto === null) return reply.code(400).send({ errore: "Id progetto non valido" });
    const [progetto] = await db.select().from(schema.projects).where(eq(schema.projects.id, idProgetto));
    if (!progetto) return reply.code(404).send({ errore: "Progetto non trovato" });
    const attivita = await db.select().from(schema.tasks).where(eq(schema.tasks.projectId, idProgetto));
    return { kpi: calcolaKpiProgetto(attivita, new Date().toISOString().slice(0, 10)) };
  });
}

function leggiId(request: FastifyRequest, chiave: string): number | null {
  const id = Number((request.params as Record<string, string>)[chiave]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function elencoDipendenze(db: Db, taskIds: number[]) {
  if (taskIds.length === 0) return [];
  return db.select().from(schema.taskDependencies).where(inArray(schema.taskDependencies.taskId, taskIds));
}

async function membroAssegnato(db: Db, taskId: number, userId: number): Promise<boolean> {
  // Il membro è "assegnato" se esiste almeno una assegnazione su attività del progetto
  // collegate allo stesso utente: si mappa l'utente sul member con stesso username non è
  // automatico (entità separate). Per l'MVP: assegnazione legata via memberId = userId
  // è falsata; si usa la corrispondenza users.username = members.nome.
  const [utente] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!utente) return false;
  const [attivita] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId));
  if (!attivita) return false;
  const assegnazioni = await db.select().from(schema.assignments).where(eq(schema.assignments.taskId, taskId));
  if (assegnazioni.length === 0) return false;
  const memberIds = assegnazioni.map(a => a.memberId);
  const membri = await db.select().from(schema.members).where(inArray(schema.members.id, memberIds));
  return membri.some(m => m.nome === utente.username);
}
