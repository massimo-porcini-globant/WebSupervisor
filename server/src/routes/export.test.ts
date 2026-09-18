/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E10.2), consumer: gate_3 evidence, gate: gate_3_implementation}
Test integrazione export Excel (E10.2, RF-22/23).
*/
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import type { FastifyInstance } from "fastify";
import { costruisceApp } from "../app.js";
import { schema, type Db } from "../data/db.js";
import type { Ruolo } from "@ws/shared";

const segreto = "test-secret-per-vitest-non-usare-in-prod-123456";

describe("export Excel (E10.2)", () => {
  let app: FastifyInstance;
  let db: Db;
  const cartellaTemp = mkdtempSync(path.join(tmpdir(), "ws-export-"));
  let idProgetto = 0;
  let idAttivita = 0;
  let idMembro = 0;

  beforeAll(async () => {
    const costruito = await costruisceApp({
      percorsoDb: path.join(cartellaTemp, "export.db"),
      segretoJwt: segreto,
      eseguiMigrations: true,
    });
    app = costruito.app;
    db = costruito.db;
    await app.ready();

    await db
      .insert(schema.users)
      .values({
        username: "utente_amministratore",
        passwordHash: bcrypt.hashSync("Password1!", 10),
        ruolo: "amministratore" as Ruolo,
        attivo: true,
        creatoIl: new Date().toISOString(),
      })
      .onConflictDoNothing();

    const [progetto] = await db
      .insert(schema.projects)
      .values({ nome: "Esportabile", priorita: "alta", inizio: "2026-10-01", fine: "2026-12-31" })
      .returning();
    idProgetto = progetto!.id;

    const [attivita] = await db
      .insert(schema.tasks)
      .values({ projectId: idProgetto, nome: "Implementazione", inizio: "2026-10-05", fine: "2026-10-10", fase: "Sviluppo", stimaOre: 40 })
      .returning();
    idAttivita = attivita!.id;

    const [membro] = await db
      .insert(schema.members)
      .values({ nome: "Luca Ferrari", ruolo: "Sviluppatore", email: "luca@example.it", capacitaPunti: 80 })
      .returning();
    idMembro = membro!.id;

    await db.insert(schema.assignments).values({
      taskId: idAttivita,
      memberId: idMembro,
      percento: 60,
      dal: "2026-10-05",
      al: "2026-10-10",
    });
  });

  afterAll(async () => {
    await app.close();
    rmSync(cartellaTemp, { recursive: true, force: true });
  });

  async function cookieAdmin(): Promise<string> {
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username: "utente_amministratore", password: "Password1!" },
    });
    expect(login.statusCode).toBe(200);
    return (login.headers["set-cookie"] as string).split(";")[0]!;
  }

  it("GET attivita.xlsx: 401 senza sessione", async () => {
    const res = await app.inject({ method: "GET", url: `/api/v1/export/progetti/${idProgetto}/attivita.xlsx` });
    expect(res.statusCode).toBe(401);
  });

  it("GET attivita.xlsx: 404 per progetto inesistente", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/export/progetti/9999/attivita.xlsx", headers: { cookie: await cookieAdmin() } });
    expect(res.statusCode).toBe(404);
  });

  it("GET attivita.xlsx: .xlsx leggibile con stato/date (RF-22)", async () => {
    const res = await app.inject({ method: "GET", url: `/api/v1/export/progetti/${idProgetto}/attivita.xlsx`, headers: { cookie: await cookieAdmin() } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("spreadsheetml");
    expect(res.headers["content-disposition"]).toContain(".xlsx");

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.rawPayload as never);
    const foglio = wb.getWorksheet("Attività")!;
    expect(foglio).toBeDefined();
    expect(foglio.getRow(1).getCell(2).value).toBe("Esportabile");
    expect(foglio.getRow(4).getCell(1).value).toBe("Implementazione");
    expect(foglio.getRow(4).getCell(4).value).toBe("2026-10-10");
  });

  it("GET allocazione.xlsx: 400 senza parametri intervallo", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/export/allocazione.xlsx", headers: { cookie: await cookieAdmin() } });
    expect(res.statusCode).toBe(400);
  });

  it("GET allocazione.xlsx: .xlsx con piano e carico (RF-23)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/export/allocazione.xlsx?dal=2026-10-05&al=2026-10-18",
      headers: { cookie: await cookieAdmin() },
    });
    expect(res.statusCode).toBe(200);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.rawPayload as never);
    const foglio = wb.getWorksheet("Allocazione")!;
    expect(foglio).toBeDefined();
    const righe: string[] = [];
    foglio.eachRow(riga => righe.push(String(riga.getCell(1).value)));
    expect(righe.some(nome => nome === "Luca Ferrari")).toBe(true);
  });
});
