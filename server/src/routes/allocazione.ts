/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E9.4), consumer: app.ts, gate: gate_3_implementation}
API allocazione (AD-20, RF-18..21): assegnazioni attività→membri, piano per progetto, carico
trasversale su intervallo con avvisi sovra-allocazione, collegamento utente↔membro.
*/
import { eq, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { assegnazioneCreateSchema, collegaUtenteSchema } from "@ws/shared";
import { settimaneIntervallo, caricoSettimanale, avvisiSovra } from "../domain/allocazione.js";
import { schema, type Db } from "../data/db.js";
import { requireRole } from "../plugins/rbac.js";

export async function registraRouteAllocazione(app: FastifyInstance, db: Db): Promise<void> {
  const ruoliScrittura = ["amministratore", "project_manager"] as const;

  app.post("/attivita/:id/assegnazioni", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ errore: "Id attività non valido" });
    const parse = assegnazioneCreateSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ errore: "Dati assegnazione non validi" });

    const [attivita] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    if (!attivita) return reply.code(404).send({ errore: "Attività non trovata" });
    const [membro] = await db.select().from(schema.members).where(eq(schema.members.id, parse.data.memberId));
    if (!membro) return reply.code(404).send({ errore: "Membro non trovato" });

    const [assegnazione] = await db
      .insert(schema.assignments)
      .values({ taskId: id, memberId: parse.data.memberId, percento: parse.data.percento, dal: parse.data.dal, al: parse.data.al })
      .returning();
    return reply.code(201).send({ assegnazione });
  });

  app.delete("/assegnazioni/:id", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ errore: "Id assegnazione non valido" });
    const rimossa = await db.delete(schema.assignments).where(eq(schema.assignments.id, id)).returning();
    if (rimossa.length === 0) return reply.code(404).send({ errore: "Assegnazione non trovata" });
    return { ok: true };
  });

  app.patch("/membri/:id/collega-utente", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ errore: "Id membro non valido" });
    const parse = collegaUtenteSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ errore: "Dati non validi" });
    if (parse.data.userId !== null) {
      const [utente] = await db.select().from(schema.users).where(eq(schema.users.id, parse.data.userId));
      if (!utente) return reply.code(404).send({ errore: "Utente non trovato" });
    }
    const [aggiornato] = await db
      .update(schema.members)
      .set({ userId: parse.data.userId })
      .where(eq(schema.members.id, id))
      .returning();
    if (!aggiornato) return reply.code(404).send({ errore: "Membro non trovato" });
    return { membro: aggiornato };
  });

  app.get("/progetti/:idProgetto/allocazione", { preHandler: [app.authenticate] }, async (request, reply) => {
    const idProgetto = Number((request.params as { idProgetto: string }).idProgetto);
    if (!Number.isInteger(idProgetto) || idProgetto <= 0) return reply.code(400).send({ errore: "Id progetto non valido" });
    const [progetto] = await db.select().from(schema.projects).where(eq(schema.projects.id, idProgetto));
    if (!progetto) return reply.code(404).send({ errore: "Progetto non trovato" });

    const attivita = await db.select().from(schema.tasks).where(eq(schema.tasks.projectId, idProgetto));
    const idsAttivita = attivita.map(a => a.id);
    const assegnazioni =
      idsAttivita.length === 0
        ? []
        : await db.select().from(schema.assignments).where(inArray(schema.assignments.taskId, idsAttivita));

    const righe = await costruisceRighe(db, assegnazioni, attivita, progetto.inizio, progetto.fine);
    return { righe, avvisi: avvisiSovra(righe) };
  });

  app.get("/allocazione/carico", { preHandler: [app.authenticate] }, async (request, reply) => {
    const query = request.query as { dal?: string; al?: string; teamId?: string };
    const isoValida = (v?: string) => v !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (!isoValida(query.dal) || !isoValida(query.al)) {
      return reply.code(400).send({ errore: "Parametri dal e al attesi in formato YYYY-MM-DD" });
    }
    const dal = query.dal!;
    const al = query.al!;
    if (al < dal) return reply.code(400).send({ errore: "La data di fine non può precedere la data di inizio" });

    const idTeam = query.teamId !== undefined && query.teamId !== "" ? Number(query.teamId) : null;
    let membri = await db.select().from(schema.members);
    if (idTeam !== null) {
      if (!Number.isInteger(idTeam) || idTeam <= 0) return reply.code(400).send({ errore: "Id team non valido" });
      membri = membri.filter(m => m.teamId === idTeam);
    }

    const attivita = await db.select().from(schema.tasks);
    const perId = new Map(attivita.map(a => [a.id, a]));
    const assegnazioniRilevanti = (await db.select().from(schema.assignments)).filter(
      a => a.dal <= al && a.al >= dal && perId.has(a.taskId)
    );

    const righe = await costruisceRighe(
      db,
      assegnazioniRilevanti,
      [...perId.values()],
      dal,
      al,
      membri.map(m => m.id)
    );
    return { righe, avvisi: avvisiSovra(righe) };
  });
}

export async function costruisceRighe(
  db: Db,
  assegnazioni: { id: number; taskId: number; memberId: number; percento: number; dal: string; al: string }[],
  attivita: { id: number; nome: string; projectId: number }[],
  dal: string,
  al: string,
  soloMemberIds?: number[]
) {
  const nomiAttivita = new Map(attivita.map(a => [a.id, a]));
  const progetti = attivita.length > 0 ? await db.select().from(schema.projects) : [];
  const nomiProgetti = new Map(progetti.map(p => [p.id, p.nome]));

  const perMembro = new Map<number, typeof assegnazioni>();
  for (const a of assegnazioni) {
    const lista = perMembro.get(a.memberId) ?? [];
    lista.push(a);
    perMembro.set(a.memberId, lista);
  }

  const memberIds = soloMemberIds ?? [...perMembro.keys()];
  if (memberIds.length === 0) return [];
  const membri = await db.select().from(schema.members).where(inArray(schema.members.id, memberIds));

  const settimane = settimaneIntervallo(dal, al);
  return membri.map(m => {
    const mie = perMembro.get(m.id) ?? [];
    return {
      memberId: m.id,
      nome: m.nome,
      capacitaPunti: m.capacitaPunti,
      assegnazioni: mie.map(a => ({
        assegnazione: a,
        attivita: nomiAttivita.get(a.taskId)?.nome ?? `#${a.taskId}`,
        progetto: nomiProgetti.get(nomiAttivita.get(a.taskId)?.projectId ?? -1) ?? "—",
      })),
      carico: caricoSettimanale(mie, m.capacitaPunti, settimane),
    };
  });
}
