/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E9.4), consumer: gate_3 evidence, gate: gate_3_implementation}
Test integrazione API allocazione (E9.4): assegnazioni, piano, carico, avvisi sovra, RBAC, errori.
*/
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { costruisceApp } from "../app.js";
import { schema, type Db } from "../data/db.js";
import type { Ruolo } from "@ws/shared";

const segreto = "test-secret-per-vitest-non-usare-in-prod-123456";

describe("allocazione (E9.4)", () => {
  let app: FastifyInstance;
  let db: Db;
  const cartellaTemp = mkdtempSync(path.join(tmpdir(), "ws-allocazione-"));
  let idProgetto = 0;
  let idAttivita = 0;
  let idMembro = 0;
  let idAssegnazione = 0;

  beforeAll(async () => {
    const costruito = await costruisceApp({
      percorsoDb: path.join(cartellaTemp, "allocazione.db"),
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
      .values({ nome: "Progetto Allocazione", priorita: "media", inizio: "2026-09-14", fine: "2026-10-31" })
      .returning();
    idProgetto = progetto!.id;

    const create = await db
      .insert(schema.tasks)
      .values([
        { projectId: idProgetto, nome: "Sviluppo front-end", inizio: "2026-09-14", fine: "2026-09-18" },
        { projectId: idProgetto, nome: "App Prenotazioni", inizio: "2026-09-14", fine: "2026-09-18" },
      ])
      .returning();
    idAttivita = create[0]!.id;

    const membri = await db
      .insert(schema.members)
      .values([
        { nome: "Luca Ferrari", ruolo: "Sviluppatore", email: "luca@example.it", capacitaPunti: 80 },
        { nome: "Sara Bianchi", ruolo: "Designer", email: "sara@example.it", capacitaPunti: 100 },
      ])
      .returning();
    idMembro = membri[0]!.id;
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

  it("POST assegnazione: 201; 400 payload invalido; 404 membro inesistente; 403 membro non PM", async () => {
    const pm = await cookieDi("project_manager");
    const creata = await app.inject({
      method: "POST",
      url: `/api/v1/attivita/${idAttivita}/assegnazioni`,
      cookies: { ws_token: pm },
      payload: { memberId: idMembro, percento: 60, dal: "2026-09-14", al: "2026-09-18" },
    });
    expect(creata.statusCode).toBe(201);
    idAssegnazione = creata.json().assegnazione.id;

    const sovra = await app.inject({
      method: "POST",
      url: `/api/v1/attivita/${idAttivita}/assegnazioni`,
      cookies: { ws_token: pm },
      payload: { memberId: idMembro, percento: 60, dal: "2026-09-14", al: "2026-09-18" },
    });
    expect(sovra.statusCode).toBe(201); // sovra-allocazione ammessa ma evidenziata (RF-20)

    const invalida = await app.inject({
      method: "POST",
      url: `/api/v1/attivita/${idAttivita}/assegnazioni`,
      cookies: { ws_token: pm },
      payload: { memberId: idMembro, percento: 150, dal: "2026-09-14", al: "2026-09-18" },
    });
    expect(invalida.statusCode).toBe(400);

    const noMembro = await app.inject({
      method: "POST",
      url: `/api/v1/attivita/${idAttivita}/assegnazioni`,
      cookies: { ws_token: pm },
      payload: { memberId: 999999, percento: 50, dal: "2026-09-14", al: "2026-09-18" },
    });
    expect(noMembro.statusCode).toBe(404);

    const vietata = await app.inject({
      method: "POST",
      url: `/api/v1/attivita/${idAttivita}/assegnazioni`,
      cookies: { ws_token: await cookieDi("membro") },
      payload: { memberId: idMembro, percento: 50, dal: "2026-09-14", al: "2026-09-18" },
    });
    expect(vietata.statusCode).toBe(403);
  });

  it("GET piano progetto: righe con assegnazioni e carico; avviso sovra (RF-19/20); 404 progetto inesistente", async () => {
    const pm = await cookieDi("project_manager");
    const piano = await app.inject({
      method: "GET",
      url: `/api/v1/progetti/${idProgetto}/allocazione`,
      cookies: { ws_token: pm },
    });
    expect(piano.statusCode).toBe(200);
    const corpo = piano.json();
    expect(corpo.righe).toHaveLength(1);
    expect(corpo.righe[0].nome).toBe("Luca Ferrari");
    expect(corpo.righe[0].assegnazioni).toHaveLength(2);
    const w1 = corpo.righe[0].carico[0];
    expect(w1.impegno).toBe(150); // (60+60)/80
    expect(w1.sovraallocata).toBe(true);
    expect(corpo.avvisi).toHaveLength(1);
    expect(corpo.avvisi[0].settimana).toBe(w1.settimana);

    const noProgetto = await app.inject({ method: "GET", url: "/api/v1/progetti/999999/allocazione" });
    expect(noProgetto.statusCode).toBe(401);
  });

  it("GET carico trasversale: settimane e avvisi; 400 senza parametri (RF-21)", async () => {
    const pm = await cookieDi("project_manager");
    const corretta = await app.inject({
      method: "GET",
      url: "/api/v1/allocazione/carico",
      cookies: { ws_token: pm },
      query: { dal: "2026-09-14", al: "2026-09-27" },
    });
    expect(corretta.statusCode).toBe(200);
    const corpo = corretta.json();
    expect(corpo.righe[0].carico).toHaveLength(2);
    expect(corpo.avvisi).toHaveLength(1);

    const senza = await app.inject({ method: "GET", url: "/api/v1/allocazione/carico", cookies: { ws_token: pm } });
    expect(senza.statusCode).toBe(400);
  });

  it("PATCH collega-utente: FK membro→utente; RBAC membro-assegnato via user_id (AD-21)", async () => {
    const pm = await cookieDi("project_manager");
    const loginMembro = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username: "utente_membro", password: "Password1!" },
    });
    const cookieMembro = (loginMembro.headers["set-cookie"] as string).split(";")[0]!.split("=").slice(1).join("=");

    // Prima del collegamento: utente_membro NON è assegnato → 403 su PATCH attività
    const prima = await app.inject({
      method: "PATCH",
      url: `/api/v1/attivita/${idAttivita}`,
      cookies: { ws_token: cookieMembro },
      payload: { stato: "in-corso" },
    });
    expect(prima.statusCode).toBe(403);

    // Collega membro → utente_membro (richiede id utente)
    const utenti = await db.select().from(schema.users);
    const idUtenteMembro = utenti.find(u => u.username === "utente_membro")!.id;
    const collegamento = await app.inject({
      method: "PATCH",
      url: `/api/v1/membri/${idMembro}/collega-utente`,
      cookies: { ws_token: pm },
      payload: { userId: idUtenteMembro },
    });
    expect(collegamento.statusCode).toBe(200);

    // Dopo il collegamento: membro assegnato → 200
    const dopo = await app.inject({
      method: "PATCH",
      url: `/api/v1/attivita/${idAttivita}`,
      cookies: { ws_token: cookieMembro },
      payload: { stato: "in-corso" },
    });
    expect(dopo.statusCode).toBe(200);
  });

  it("DELETE assegnazione: 200; 404 dopo rimozione", async () => {
    const pm = await cookieDi("project_manager");
    const rimossa = await app.inject({ method: "DELETE", url: `/api/v1/assegnazioni/${idAssegnazione}`, cookies: { ws_token: pm } });
    expect(rimossa.statusCode).toBe(200);
    const diNuovo = await app.inject({ method: "DELETE", url: `/api/v1/assegnazioni/${idAssegnazione}`, cookies: { ws_token: pm } });
    expect(diNuovo.statusCode).toBe(404);
  });

  afterAll(async () => {
    await app.close();
    rmSync(cartellaTemp, { recursive: true, force: true });
  });
});
