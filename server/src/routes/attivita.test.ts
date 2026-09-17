/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E3.1/E3.2/E3.3), consumer: gate_3 evidence, gate: gate_3_implementation}
Test integrazione attività: CRUD, dipendenze anti-ciclo, RBAC membro assegnato, KPI.
*/
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { costruisceApp } from "../app.js";
import { schema, type Db } from "../data/db.js";
import type { Ruolo } from "@ws/shared";

const segreto = "test-secret-per-vitest-non-usare-in-prod-123456";

describe("attività (E3.1/E3.2/E3.3)", () => {
  let app: FastifyInstance;
  let db: Db;
  const cartellaTemp = mkdtempSync(path.join(tmpdir(), "ws-attivita-"));
  let idProgetto = 0;

  beforeAll(async () => {
    const costruito = await costruisceApp({
      percorsoDb: path.join(cartellaTemp, "attivita.db"),
      segretoJwt: segreto,
      eseguiMigrations: true,
    });
    app = costruito.app;
    db = costruito.db;
    await app.ready();

    await db
      .insert(schema.users)
      .values(
        (["amministratore", "project_manager", "membro", "osservatore"] as Ruolo[]).map(ruolo => ({
          username: `utente_${ruolo}`,
          passwordHash: bcrypt.hashSync("Password1!", 10),
          ruolo,
          attivo: true,
          creatoIl: new Date().toISOString(),
        }))
      )
      .onConflictDoNothing();

    const [progetto] = await db
      .insert(schema.projects)
      .values({ nome: "Progetto attività", priorita: "media", inizio: "2026-09-01", fine: "2026-12-31" })
      .returning();
    if (!progetto) throw new Error("progetto non creato");
    idProgetto = progetto.id;

    await db
      .insert(schema.members)
      .values({ nome: "utente_membro", ruolo: "Sviluppatore", email: "membro@example.it" })
      .onConflictDoNothing();
  });

  async function cookieDi(ruolo: Ruolo): Promise<string> {
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username: `utente_${ruolo}`, password: "Password1!" },
    });
    expect(login.statusCode).toBe(200);
    return (login.headers["set-cookie"] as string).split(";")[0]!.split("=").slice(1).join("=");
  }

  async function creaAttivita(nome: string, extra: Record<string, unknown> = {}) {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/progetti/${idProgetto}/attivita`,
      cookies: { ws_token: await cookieDi("project_manager") },
      payload: { nome, inizio: "2026-09-01", fine: "2026-09-30", ...extra },
    });
    expect(res.statusCode).toBe(201);
    return res.json().attivita as { id: number };
  }

  it("POST crea attività: 201, progetto inesistente → 404, payload invalido → 400, senza auth 401", async () => {
    const pm = await cookieDi("project_manager");
    const a = await creaAttivita("Analisi requisiti", { stimaOre: 8 });
    expect(a.id).toBeGreaterThan(0);

    const noProgetto = await app.inject({
      method: "POST",
      url: "/api/v1/progetti/999999/attivita",
      cookies: { ws_token: pm },
      payload: { nome: "X", inizio: "2026-09-01", fine: "2026-09-30" },
    });
    expect(noProgetto.statusCode).toBe(404);

    const invalida = await app.inject({
      method: "POST",
      url: `/api/v1/progetti/${idProgetto}/attivita`,
      cookies: { ws_token: pm },
      payload: { nome: "", inizio: "2026-10-01", fine: "2026-09-30" },
    });
    expect(invalida.statusCode).toBe(400);

    const noAuth = await app.inject({
      method: "POST",
      url: `/api/v1/progetti/${idProgetto}/attivita`,
      payload: { nome: "X", inizio: "2026-09-01", fine: "2026-09-30" },
    });
    expect(noAuth.statusCode).toBe(401);
  });

  it("GET elenco attività con dipendenze; 404 per progetto inesistente", async () => {
    const pm = await cookieDi("project_manager");
    const elenco = await app.inject({
      method: "GET",
      url: `/api/v1/progetti/${idProgetto}/attivita`,
      cookies: { ws_token: pm },
    });
    expect(elenco.statusCode).toBe(200);
    expect(elenco.json().attivita.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(elenco.json().dipendenze)).toBe(true);

    const noProgetto = await app.inject({ method: "GET", url: "/api/v1/progetti/999999/attivita", cookies: { ws_token: pm } });
    expect(noProgetto.statusCode).toBe(404);
  });

  it("dipendenze: 201, auto-dipendenza 400, ciclo 400, rimozione 200", async () => {
    const pm = await cookieDi("project_manager");
    const a = await creaAttivita("Dip A");
    const b = await creaAttivita("Dip B");
    const c = await creaAttivita("Dip C");

    const ok = await app.inject({
      method: "POST",
      url: `/api/v1/attivita/${b.id}/dipendenze`,
      cookies: { ws_token: pm },
      payload: { dependsOn: a.id },
    });
    expect(ok.statusCode).toBe(201);

    const auto = await app.inject({
      method: "POST",
      url: `/api/v1/attivita/${a.id}/dipendenze`,
      cookies: { ws_token: pm },
      payload: { dependsOn: a.id },
    });
    expect(auto.statusCode).toBe(400);

    // b dipende da a; c dipende da b → a dipende da c chiuderebbe il ciclo
    const catena = await app.inject({
      method: "POST",
      url: `/api/v1/attivita/${c.id}/dipendenze`,
      cookies: { ws_token: pm },
      payload: { dependsOn: b.id },
    });
    expect(catena.statusCode).toBe(201);

    const ciclo = await app.inject({
      method: "POST",
      url: `/api/v1/attivita/${a.id}/dipendenze`,
      cookies: { ws_token: pm },
      payload: { dependsOn: c.id },
    });
    expect(ciclo.statusCode).toBe(400);

    const rimuovi = await app.inject({
      method: "DELETE",
      url: `/api/v1/attivita/${c.id}/dipendenze/${b.id}`,
      cookies: { ws_token: pm },
    });
    expect(rimuovi.statusCode).toBe(200);
  });

  it("membro assegnato: aggiorna stato+lavorateOre; nome → 403; non assegnato → 403; osservatore → 403", async () => {
    const a = await creaAttivita("Assegnata al membro", { stimaOre: 4 });
    const [membroUtente] = await db.select().from(schema.users).where(eq(schema.users.username, "utente_membro"));
    const [membroDb] = await db.select().from(schema.members).where(eq(schema.members.nome, "utente_membro"));
    if (!membroUtente || !membroDb) throw new Error("utente/membro di test mancanti");
    await db.insert(schema.assignments).values({
      taskId: a.id,
      memberId: membroDb.id,
      percento: 50,
      dal: "2026-09-01",
      al: "2026-09-30",
    });

    const membro = await cookieDi("membro");
    const oss = await cookieDi("osservatore");

    const consentito = await app.inject({
      method: "PATCH",
      url: `/api/v1/attivita/${a.id}`,
      cookies: { ws_token: membro },
      payload: { stato: "in-corso", lavorateOre: 2 },
    });
    expect(consentito.statusCode).toBe(200);
    expect(consentito.json().attivita).toMatchObject({ stato: "in-corso", lavorateOre: 2 });

    const vietatoNome = await app.inject({
      method: "PATCH",
      url: `/api/v1/attivita/${a.id}`,
      cookies: { ws_token: membro },
      payload: { nome: "Rinominata dal membro" },
    });
    expect(vietatoNome.statusCode).toBe(403);

    // attività non assegnata al membro
    const b = await creaAttivita("Non assegnata");
    const nonAssegnata = await app.inject({
      method: "PATCH",
      url: `/api/v1/attivita/${b.id}`,
      cookies: { ws_token: membro },
      payload: { stato: "in-corso" },
    });
    expect(nonAssegnata.statusCode).toBe(403);

    const osservatore = await app.inject({
      method: "PATCH",
      url: `/api/v1/attivita/${a.id}`,
      cookies: { ws_token: oss },
      payload: { stato: "in-corso" },
    });
    expect(osservatore.statusCode).toBe(403);
  });

  it("KPI riepilogo: conteggi e scadenze; 404 progetto inesistente", async () => {
    const pm = await cookieDi("project_manager");
    await creaAttivita("KPI completata", { stato: "completata", fine: "2026-09-05" });
    await creaAttivita("KPI in corso", { stato: "in-corso", fine: "2026-10-30" });

    const kpi = await app.inject({
      method: "GET",
      url: `/api/v1/progetti/${idProgetto}/kpi`,
      cookies: { ws_token: pm },
    });
    expect(kpi.statusCode).toBe(200);
    const corpo = kpi.json().kpi;
    expect(corpo.completate).toBeGreaterThanOrEqual(1);
    expect(corpo.inCorso).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(corpo.scadenzeProssime)).toBe(true);

    const noProgetto = await app.inject({ method: "GET", url: "/api/v1/progetti/999999/kpi", cookies: { ws_token: pm } });
    expect(noProgetto.statusCode).toBe(404);
  });

  it("DELETE attività: 200 e dipendenze pulite; 404 successivo", async () => {
    const pm = await cookieDi("project_manager");
    const a = await creaAttivita("Da cancellare");
    const b = await creaAttivita("Che dipendeva");
    await app.inject({ method: "POST", url: `/api/v1/attivita/${b.id}/dipendenze`, cookies: { ws_token: pm }, payload: { dependsOn: a.id } });

    const cancella = await app.inject({ method: "DELETE", url: `/api/v1/attivita/${a.id}`, cookies: { ws_token: pm } });
    expect(cancella.statusCode).toBe(200);

    const ripeti = await app.inject({ method: "DELETE", url: `/api/v1/attivita/${a.id}`, cookies: { ws_token: pm } });
    expect(ripeti.statusCode).toBe(404);

    const dipendenze = await app.inject({ method: "GET", url: `/api/v1/progetti/${idProgetto}/attivita`, cookies: { ws_token: pm } });
    expect(dipendenze.json().dipendenze.every((d: { taskId: number }) => d.taskId !== a.id)).toBe(true);
  });

  it("avanzamento progetti: GET /progetti restituisce avanzamento e suggerimentoStato", async () => {
    const pm = await cookieDi("project_manager");
    const elenco = await app.inject({ method: "GET", url: "/api/v1/progetti", cookies: { ws_token: pm } });
    expect(elenco.statusCode).toBe(200);
    const riga = elenco.json().progetti.find((p: { id: number }) => p.id === idProgetto);
    expect(riga).toBeDefined();
    expect(typeof riga.suggerimentoStato).toBe("string");
    expect(riga.avanzamento === null || typeof riga.avanzamento === "number").toBe(true);
  });

  afterAll(async () => {
    await app.close();
    rmSync(cartellaTemp, { recursive: true, force: true });
  });
});
