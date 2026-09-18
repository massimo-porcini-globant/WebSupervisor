/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E10.2), consumer: app.ts, gate: gate_3_implementation}
Export Excel (AD-26, RF-22/23): attività progetto e piano allocazione in .xlsx, download autenticato.
*/
import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import { foglioAttivita, foglioAllocazione, scrivi } from "../domain/export.js";
import { avvisiSovra } from "../domain/allocazione.js";
import { costruisceRighe } from "./allocazione.js";
import { schema, type Db } from "../data/db.js";

export async function registraRouteExport(app: FastifyInstance, db: Db): Promise<void> {
  app.get("/export/progetti/:idProgetto/attivita.xlsx", { preHandler: [app.authenticate] }, async (request, reply) => {
    const idProgetto = Number((request.params as { idProgetto: string }).idProgetto);
    if (!Number.isInteger(idProgetto) || idProgetto <= 0) return reply.code(400).send({ errore: "Id progetto non valido" });
    const [progetto] = await db.select().from(schema.projects).where(eq(schema.projects.id, idProgetto));
    if (!progetto) return reply.code(404).send({ errore: "Progetto non trovato" });
    const attivita = await db.select().from(schema.tasks).where(eq(schema.tasks.projectId, idProgetto));

    const workbook = new ExcelJS.Workbook();
    foglioAttivita(workbook, { progetto: progetto.nome, attivita });
    return inviaExcel(reply, `attivita-${idProgetto}.xlsx`, workbook);
  });

  app.get("/export/allocazione.xlsx", { preHandler: [app.authenticate] }, async (request, reply) => {
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
    const workbook = new ExcelJS.Workbook();
    foglioAllocazione(workbook, { dal, al, righe, avvisi: avvisiSovra(righe) });
    return inviaExcel(reply, "allocazione.xlsx", workbook);
  });
}

async function inviaExcel(reply: FastifyReply, nome: string, workbook: ExcelJS.Workbook): Promise<void> {
  const buffer = await scrivi(workbook);
  reply
    .header("content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    .header("content-disposition", `attachment; filename="${nome}"`)
    .send(buffer);
}
