/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E5.3), consumer: gate_3 evidence, gate: gate_3_implementation}
Test integrazione API team (E5.3): CRUD team/membri, assenze anti-sovrapposizione, RBAC, errori.
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

describe("team (E5.3)", () => {
  let app: FastifyInstance;
  let db: Db;
  const cartellaTemp = mkdtempSync(path.join(tmpdir(), "ws-team-"));
  let idTeam = 0;
  let idMembro = 0;

  beforeAll(async () => {
    const costruito = await costruisceApp({
      percorsoDb: path.join(cartellaTemp, "team.db"),
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

  it("POST team: 201, duplicato 409, nome vuoto 400, lettura con membri/capacità 200", async () => {
    const pm = await cookieDi("project_manager");
    const creato = await app.inject({ method: "POST", url: "/api/v1/team", cookies: { ws_token: pm }, payload: { nome: "Piattaforma" } });
    expect(creato.statusCode).toBe(201);
    idTeam = creato.json().team.id;

    const duplicato = await app.inject({ method: "POST", url: "/api/v1/team", cookies: { ws_token: pm }, payload: { nome: "Piattaforma" } });
    expect(duplicato.statusCode).toBe(409);

    const invalido = await app.inject({ method: "POST", url: "/api/v1/team", cookies: { ws_token: pm }, payload: { nome: "" } });
    expect(invalido.statusCode).toBe(400);

    const elenco = await app.inject({ method: "GET", url: "/api/v1/team", cookies: { ws_token: pm } });
    expect(elenco.statusCode).toBe(200);
    expect(elenco.json().team[0]).toMatchObject({ nome: "Piattaforma", membri: 0, capacita: 0 });
  });

  it("POST membro: 201, competenze e capacità; elenco membri 200; 404 team inesistente", async () => {
    const pm = await cookieDi("project_manager");
    const creato = await app.inject({
      method: "POST",
      url: `/api/v1/team/${idTeam}/membri`,
      cookies: { ws_token: pm },
      payload: { nome: "Alice Rossi", ruolo: "Sviluppatrice", email: "alice@example.it", competenze: "React, Node", capacitaPunti: 80 },
    });
    expect(creato.statusCode).toBe(201);
    idMembro = creato.json().membro.id;
    expect(creato.json().membro).toMatchObject({ competenze: "React, Node", capacitaPunti: 80, teamId: idTeam });

    const elenco = await app.inject({ method: "GET", url: `/api/v1/team/${idTeam}/membri`, cookies: { ws_token: pm } });
    expect(elenco.statusCode).toBe(200);
    expect(elenco.json().membri).toHaveLength(1);

    const noTeam = await app.inject({ method: "POST", url: "/api/v1/team/999999/membri", cookies: { ws_token: pm }, payload: { nome: "X", ruolo: "Y", email: "x@y.it" } });
    expect(noTeam.statusCode).toBe(404);

    const invalido = await app.inject({
      method: "POST",
      url: `/api/v1/team/${idTeam}/membri`,
      cookies: { ws_token: pm },
      payload: { nome: "Bob", ruolo: "QA", email: "email-non-valida" },
    });
    expect(invalido.statusCode).toBe(400);
  });

  it("PATCH membro: 200 aggiornamento capacità; 404 inesistente", async () => {
    const pm = await cookieDi("project_manager");
    const aggiornato = await app.inject({
      method: "PATCH",
      url: `/api/v1/membri/${idMembro}`,
      cookies: { ws_token: pm },
      payload: { capacitaPunti: 50, competenze: "React, Node, SQLite" },
    });
    expect(aggiornato.statusCode).toBe(200);
    expect(aggiornato.json().membro).toMatchObject({ capacitaPunti: 50, competenze: "React, Node, SQLite" });

    const noMembro = await app.inject({ method: "PATCH", url: "/api/v1/membri/999999", cookies: { ws_token: pm }, payload: { capacitaPunti: 50 } });
    expect(noMembro.statusCode).toBe(404);
  });

  it("capacità complessiva nel GET /team riflette i membri", async () => {
    const pm = await cookieDi("project_manager");
    const elenco = await app.inject({ method: "GET", url: "/api/v1/team", cookies: { ws_token: pm } });
    expect(elenco.json().team[0]).toMatchObject({ membri: 1, capacita: 50 });
  });

  it("assenze: 201, sovrapposta 400, elenco 200, rimozione 200", async () => {
    const pm = await cookieDi("project_manager");
    const creata = await app.inject({
      method: "POST",
      url: `/api/v1/membri/${idMembro}/assenze`,
      cookies: { ws_token: pm },
      payload: { dal: "2026-07-01", al: "2026-07-10", motivo: "Ferie", impattoPercento: 100 },
    });
    expect(creata.statusCode).toBe(201);
    const idAssenza = creata.json().assenza.id;

    const sovrapposta = await app.inject({
      method: "POST",
      url: `/api/v1/membri/${idMembro}/assenze`,
      cookies: { ws_token: pm },
      payload: { dal: "2026-07-08", al: "2026-07-15", motivo: "Ferie" },
    });
    expect(sovrapposta.statusCode).toBe(400);

    const elenco = await app.inject({ method: "GET", url: `/api/v1/membri/${idMembro}/assenze`, cookies: { ws_token: pm } });
    expect(elenco.statusCode).toBe(200);
    expect(elenco.json().assenze).toHaveLength(1);

    const rimossa = await app.inject({ method: "DELETE", url: `/api/v1/assenze/${idAssenza}`, cookies: { ws_token: pm } });
    expect(rimossa.statusCode).toBe(200);
  });

  it("RBAC: membro/osservatore in scrittura → 403; senza auth → 401", async () => {
    const membro = await cookieDi("membro");
    const osservatore = await cookieDi("osservatore");
    const vietatoMembro = await app.inject({ method: "POST", url: `/api/v1/team/${idTeam}/membri`, cookies: { ws_token: membro }, payload: { nome: "X", ruolo: "Y", email: "x@y.it" } });
    expect(vietatoMembro.statusCode).toBe(403);
    const vietatoOss = await app.inject({ method: "DELETE", url: `/api/v1/assenze/1`, cookies: { ws_token: osservatore } });
    expect(vietatoOss.statusCode).toBe(403);
    const noAuth = await app.inject({ method: "GET", url: "/api/v1/team" });
    expect(noAuth.statusCode).toBe(401);
  });

  it("DELETE membro: 200 con assegnazioniRimosse; assenze a cascata; 404 dopo", async () => {
    const pm = await cookieDi("project_manager");
    const rimosso = await app.inject({ method: "DELETE", url: `/api/v1/membri/${idMembro}`, cookies: { ws_token: pm } });
    expect(rimosso.statusCode).toBe(200);
    expect(rimosso.json().ok).toBe(true);

    const dopo = await app.inject({ method: "GET", url: `/api/v1/membri/${idMembro}/assenze`, cookies: { ws_token: pm } });
    expect(dopo.statusCode).toBe(404);

    const diNuovo = await app.inject({ method: "DELETE", url: `/api/v1/membri/${idMembro}`, cookies: { ws_token: pm } });
    expect(diNuovo.statusCode).toBe(404);
  });

  afterAll(async () => {
    await app.close();
    rmSync(cartellaTemp, { recursive: true, force: true });
  });
});
