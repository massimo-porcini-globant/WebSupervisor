/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E5.3), consumer: app.ts, gate: gate_3_implementation}
API team (RF-14..16, AD-10): CRUD team/membri, assenze con anti-sovrapposizione, RBAC ruoliScrittura.
*/
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { teamCreateSchema, membroCreateSchema, membroPatchSchema, assenzaCreateSchema } from "@ws/shared";
import { assenzaSovrapposta } from "../domain/team.js";
import { schema, type Db } from "../data/db.js";
import { requireRole } from "../plugins/rbac.js";

export async function registraRouteTeam(app: FastifyInstance, db: Db): Promise<void> {
  const ruoliScrittura = ["amministratore", "project_manager"] as const;

  app.get("/team", { preHandler: [app.authenticate] }, async () => {
    const team = await db.select().from(schema.teams).orderBy(schema.teams.nome);
    const membri = await db.select().from(schema.members);
    return {
      team: team.map(t => {
        const delTeam = membri.filter(m => m.teamId === t.id);
        return {
          id: t.id,
          nome: t.nome,
          membri: delTeam.length,
          capacita: delTeam.reduce((somma, m) => somma + m.capacitaPunti, 0),
        };
      }),
    };
  });

  app.post("/team", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const parse = teamCreateSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ errore: "Dati team non validi" });
    const [creato] = await db
      .insert(schema.teams)
      .values({ nome: parse.data.nome })
      .onConflictDoNothing()
      .returning();
    if (!creato) return reply.code(409).send({ errore: "Esiste già un team con questo nome" });
    return reply.code(201).send({ team: creato });
  });

  app.get("/team/:idTeam/membri", { preHandler: [app.authenticate] }, async (request, reply) => {
    const idTeam = Number((request.params as { idTeam: string }).idTeam);
    if (!Number.isInteger(idTeam) || idTeam <= 0) return reply.code(400).send({ errore: "Id team non valido" });
    const [team] = await db.select().from(schema.teams).where(eq(schema.teams.id, idTeam));
    if (!team) return reply.code(404).send({ errore: "Team non trovato" });
    const membri = await db.select().from(schema.members).where(eq(schema.members.teamId, idTeam));
    return { membri };
  });

  app.post("/team/:idTeam/membri", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const idTeam = Number((request.params as { idTeam: string }).idTeam);
    if (!Number.isInteger(idTeam) || idTeam <= 0) return reply.code(400).send({ errore: "Id team non valido" });
    const [team] = await db.select().from(schema.teams).where(eq(schema.teams.id, idTeam));
    if (!team) return reply.code(404).send({ errore: "Team non trovato" });
    const parse = membroCreateSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ errore: "Dati membro non validi" });
    const [membro] = await db
      .insert(schema.members)
      .values({ ...parse.data, competenze: parse.data.competenze ?? null, capacitaPunti: parse.data.capacitaPunti ?? 100, teamId: idTeam })
      .returning();
    return reply.code(201).send({ membro });
  });

  app.patch("/membri/:id", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ errore: "Id membro non valido" });
    const parse = membroPatchSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ errore: "Dati membro non validi" });
    if (Object.keys(parse.data).length === 0) return reply.code(400).send({ errore: "Nessun campo da aggiornare" });
    const [aggiornato] = await db.update(schema.members).set(parse.data).where(eq(schema.members.id, id)).returning();
    if (!aggiornato) return reply.code(404).send({ errore: "Membro non trovato" });
    return { membro: aggiornato };
  });

  app.delete("/membri/:id", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ errore: "Id membro non valido" });
    const assegnazioniRimosse = await db.delete(schema.assignments).where(eq(schema.assignments.memberId, id)).returning();
    await db.delete(schema.memberAbsences).where(eq(schema.memberAbsences.memberId, id));
    const rimosso = await db.delete(schema.members).where(eq(schema.members.id, id)).returning();
    if (rimosso.length === 0) return reply.code(404).send({ errore: "Membro non trovato" });
    return { ok: true, assegnazioniRimosse: assegnazioniRimosse.length };
  });

  app.get("/membri/:id/assenze", { preHandler: [app.authenticate] }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ errore: "Id membro non valido" });
    const [membro] = await db.select().from(schema.members).where(eq(schema.members.id, id));
    if (!membro) return reply.code(404).send({ errore: "Membro non trovato" });
    const assenze = await db.select().from(schema.memberAbsences).where(eq(schema.memberAbsences.memberId, id));
    return { assenze };
  });

  app.post("/membri/:id/assenze", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ errore: "Id membro non valido" });
    const [membro] = await db.select().from(schema.members).where(eq(schema.members.id, id));
    if (!membro) return reply.code(404).send({ errore: "Membro non trovato" });
    const parse = assenzaCreateSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ errore: "Dati assenza non validi" });
    const esistenti = await db.select().from(schema.memberAbsences).where(eq(schema.memberAbsences.memberId, id));
    if (assenzaSovrapposta(parse.data, esistenti)) {
      return reply.code(400).send({ errore: "Il periodo si sovrappone a un'assenza già registrata" });
    }
    const [assenza] = await db
      .insert(schema.memberAbsences)
      .values({
        memberId: id,
        dal: parse.data.dal,
        al: parse.data.al,
        motivo: parse.data.motivo,
        impattoPercento: parse.data.impattoPercento ?? 100,
      })
      .returning();
    return reply.code(201).send({ assenza });
  });

  app.delete("/assenze/:id", { preHandler: [requireRole(app, ...ruoliScrittura)] }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ errore: "Id assenza non valido" });
    const rimossa = await db.delete(schema.memberAbsences).where(eq(schema.memberAbsences.id, id)).returning();
    if (rimossa.length === 0) return reply.code(404).send({ errore: "Assenza non trovata" });
    return { ok: true };
  });
}
