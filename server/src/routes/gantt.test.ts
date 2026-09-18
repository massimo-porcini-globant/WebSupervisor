/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E4.1), consumer: gate_3 evidence, gate: gate_3_implementation}
Test integrazione API gantt: criticità CPM server-side, dipendenze, 401/404/400.
*/
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { costruisceApp } from "../app.js";
import { schema, type Db } from "../data/db.js";

const segreto = "test-secret-per-vitest-non-usare-in-prod-123456";

describe("gantt (E4.1)", () => {
  let app: FastifyInstance;
  let db: Db;
  const cartellaTemp = mkdtempSync(path.join(tmpdir(), "ws-gantt-"));
  let idProgetto = 0;

  beforeAll(async () => {
    const costruito = await costruisceApp({
      percorsoDb: path.join(cartellaTemp, "gantt.db"),
      segretoJwt: segreto,
      eseguiMigrations: true,
    });
    app = costruito.app;
    db = costruito.db;
    await app.ready();

    await db
      .insert(schema.users)
      .values({
        username: "utente_project_manager",
        passwordHash: bcrypt.hashSync("Password1!", 10),
        ruolo: "project_manager",
        attivo: true,
        creatoIl: new Date().toISOString(),
      })
      .onConflictDoNothing();

    const [progetto] = await db
      .insert(schema.projects)
      .values({ nome: "Progetto Gantt", priorita: "alta", inizio: "2026-09-01", fine: "2026-10-31" })
      .returning();
    if (!progetto) throw new Error("progetto non creato");
    idProgetto = progetto.id;

    // Catena A (10gg) → B (5gg) con C (2gg) parallelo: C non critico, margine 3
    const create = await db
      .insert(schema.tasks)
      .values([
        { projectId: idProgetto, nome: "A", inizio: "2026-09-01", fine: "2026-09-10" },
        { projectId: idProgetto, nome: "B", inizio: "2026-09-11", fine: "2026-09-15" },
        { projectId: idProgetto, nome: "C", inizio: "2026-09-11", fine: "2026-09-12" },
      ])
      .returning();
    const idA = create.find(t => t.nome === "A")!.id;
    const idB = create.find(t => t.nome === "B")!.id;
    const idC = create.find(t => t.nome === "C")!.id;
    await db.insert(schema.taskDependencies).values([
      { taskId: idB, dependsOn: idA },
      { taskId: idC, dependsOn: idA },
    ]);
  });

  async function cookiePm(): Promise<string> {
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username: "utente_project_manager", password: "Password1!" },
    });
    expect(login.statusCode).toBe(200);
    return (login.headers["set-cookie"] as string).split(";")[0]!.split("=").slice(1).join("=");
  }

  it("GET gantt: 200 con criticità CPM corretta (A e B critiche, C no) e metadati", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/progetti/${idProgetto}/gantt`,
      cookies: { ws_token: await cookiePm() },
    });
    expect(res.statusCode).toBe(200);
    const corpo = res.json();
    expect(corpo.attivita).toHaveLength(3);
    expect(corpo.dipendenze).toHaveLength(2);
    const perNome = new Map<string, { critica: boolean }>(
      (corpo.attivita as { nome: string; critica: boolean }[]).map(a => [a.nome, a])
    );
    expect(perNome.get("A")!.critica).toBe(true);
    expect(perNome.get("B")!.critica).toBe(true);
    expect(perNome.get("C")!.critica).toBe(false);
    expect(corpo.cpm.fineProgetto).toBe(14);
    expect(corpo.cpm.critiche).toBe(2);
  });

  it("GET gantt: 401 senza auth, 404 progetto inesistente, 400 id invalido", async () => {
    const pm = await cookiePm();
    const noAuth = await app.inject({ method: "GET", url: `/api/v1/progetti/${idProgetto}/gantt` });
    expect(noAuth.statusCode).toBe(401);

    const noProgetto = await app.inject({ method: "GET", url: "/api/v1/progetti/999999/gantt", cookies: { ws_token: pm } });
    expect(noProgetto.statusCode).toBe(404);

    const invalido = await app.inject({ method: "GET", url: "/api/v1/progetti/abc/gantt", cookies: { ws_token: pm } });
    expect(invalido.statusCode).toBe(400);
  });

  afterAll(async () => {
    await app.close();
    rmSync(cartellaTemp, { recursive: true, force: true });
  });
});
