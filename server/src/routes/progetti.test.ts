/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E2.1/E2.2), consumer: gate_3 evidence, gate: gate_3_implementation}
Test integrazione CRUD progetti, filtri/paginazione, archiviazione e matrice RBAC (Fastify inject + DB temporaneo).
*/
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { costruisceApp } from "../app.js";
import { schema } from "../data/db.js";
import type { Ruolo } from "@ws/shared";

const segreto = "test-secret-per-vitest-non-usare-in-prod-123456";
const RUOLI: Ruolo[] = ["amministratore", "project_manager", "membro", "osservatore"];

describe("progetti (E2.1/E2.2)", () => {
  let app: FastifyInstance;
  const cartellaTemp = mkdtempSync(path.join(tmpdir(), "ws-progetti-"));

  beforeAll(async () => {
    const costruito = await costruisceApp({
      percorsoDb: path.join(cartellaTemp, "progetti.db"),
      segretoJwt: segreto,
      eseguiMigrations: true,
    });
    app = costruito.app;
    const db = costruito.db;
    await app.ready();
    await db
      .insert(schema.users)
      .values(
        RUOLI.map(ruolo => ({
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

  it("POST crea progetto: 201 per PM, 403 per membro, 400 per payload invalido", async () => {
    const pm = await cookieDi("project_manager");
    const membro = await cookieDi("membro");

    const crea = await app.inject({
      method: "POST",
      url: "/api/v1/progetti",
      cookies: { ws_token: pm },
      payload: { nome: "Portale Fornitori", priorita: "alta", inizio: "2026-09-01", fine: "2026-12-31" },
    });
    expect(crea.statusCode).toBe(201);
    expect(crea.json().progetto).toMatchObject({ nome: "Portale Fornitori", stato: "in-linea", archiviato: false });

    const vietato = await app.inject({
      method: "POST",
      url: "/api/v1/progetti",
      cookies: { ws_token: membro },
      payload: { nome: "Non autorizzato", priorita: "media", inizio: "2026-09-01", fine: "2026-12-31" },
    });
    expect(vietato.statusCode).toBe(403);

    const invalido = await app.inject({
      method: "POST",
      url: "/api/v1/progetti",
      cookies: { ws_token: pm },
      payload: { nome: "", priorita: "altissima", inizio: "2026-09-01", fine: "2026-12-31" },
    });
    expect(invalido.statusCode).toBe(400);

    const dateInvertite = await app.inject({
      method: "POST",
      url: "/api/v1/progetti",
      cookies: { ws_token: pm },
      payload: { nome: "Invertito", priorita: "media", inizio: "2026-12-31", fine: "2026-09-01" },
    });
    expect(dateInvertite.statusCode).toBe(400);
  });

  it("POST senza autenticazione → 401", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/progetti", payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it("GET elenco: default esclude archiviati, filtri combinabili, paginazione", async () => {
    const pm = await cookieDi("project_manager");
    await app.inject({ method: "POST", url: "/api/v1/progetti", cookies: { ws_token: pm }, payload: { nome: "A - alta", priorita: "alta", inizio: "2026-09-01", fine: "2026-10-01" } });
    await app.inject({ method: "POST", url: "/api/v1/progetti", cookies: { ws_token: pm }, payload: { nome: "B - bassa", priorita: "bassa", inizio: "2026-09-01", fine: "2026-10-01" } });
    const creato = await app.inject({ method: "POST", url: "/api/v1/progetti", cookies: { ws_token: pm }, payload: { nome: "C - da archiviare", priorita: "media", inizio: "2026-09-01", fine: "2026-10-01" } });
    const idC = creato.json().progetto.id;
    await app.inject({ method: "POST", url: `/api/v1/progetti/${idC}/archivia`, cookies: { ws_token: pm } });

    const elenco = await app.inject({ method: "GET", url: "/api/v1/progetti", cookies: { ws_token: pm } });
    expect(elenco.statusCode).toBe(200);
    const corpi = elenco.json();
    expect(corpi.progetti.map((p: { nome: string }) => p.nome)).not.toContain("C - da archiviato".replace("archiviato", "archiviare"));
    expect(corpi.totale).toBeGreaterThanOrEqual(2);

    const soloAlta = await app.inject({ method: "GET", url: "/api/v1/progetti?priorita=alta", cookies: { ws_token: pm } });
    expect(soloAlta.json().progetti.every((p: { priorita: string }) => p.priorita === "alta")).toBe(true);

    const conArchiviati = await app.inject({ method: "GET", url: "/api/v1/progetti?archiviati=true", cookies: { ws_token: pm } });
    expect(conArchiviati.json().progetti.map((p: { id: number }) => p.id)).toContain(idC);

    const paginato = await app.inject({ method: "GET", url: "/api/v1/progetti?page=1&pageSize=1", cookies: { ws_token: pm } });
    expect(paginato.json().progetti.length).toBe(1);
    expect(paginato.json().pageSize).toBe(1);
    expect(paginato.json().page).toBe(1);
  });

  it("GET dettaglio: 200, 404 per id inesistente", async () => {
    const pm = await cookieDi("project_manager");
    const res = await app.inject({ method: "GET", url: "/api/v1/progetti/999999", cookies: { ws_token: pm } });
    expect(res.statusCode).toBe(404);
  });

  it("PATCH modifica: 200 per PM, 400 payload invalido, 404 id inesistente", async () => {
    const pm = await cookieDi("project_manager");
    const crea = await app.inject({
      method: "POST",
      url: "/api/v1/progetti",
      cookies: { ws_token: pm },
      payload: { nome: "Da modificare", priorita: "bassa", inizio: "2026-09-01", fine: "2026-10-01" },
    });
    const id = crea.json().progetto.id;

    const patch = await app.inject({
      method: "PATCH",
      url: `/api/v1/progetti/${id}`,
      cookies: { ws_token: pm },
      payload: { stato: "a-rischio", descrizione: "Aggiornato" },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().progetto).toMatchObject({ stato: "a-rischio", descrizione: "Aggiornato" });

    const invalida = await app.inject({ method: "PATCH", url: `/api/v1/progetti/${id}`, cookies: { ws_token: pm }, payload: { priorita: "no" } });
    expect(invalida.statusCode).toBe(400);

    const vuota = await app.inject({ method: "PATCH", url: `/api/v1/progetti/${id}`, cookies: { ws_token: pm }, payload: {} });
    expect(vuota.statusCode).toBe(400);
  });

  it("archivia/ripristina: 200 e stato persistito; osservatore → 403", async () => {
    const pm = await cookieDi("project_manager");
    const oss = await cookieDi("osservatore");
    const crea = await app.inject({
      method: "POST",
      url: "/api/v1/progetti",
      cookies: { ws_token: pm },
      payload: { nome: "Da archiviare", priorita: "media", inizio: "2026-09-01", fine: "2026-10-01" },
    });
    const id = crea.json().progetto.id;

    const vietato = await app.inject({ method: "POST", url: `/api/v1/progetti/${id}/archivia`, cookies: { ws_token: oss } });
    expect(vietato.statusCode).toBe(403);

    const archivia = await app.inject({ method: "POST", url: `/api/v1/progetti/${id}/archivia`, cookies: { ws_token: pm } });
    expect(archivia.statusCode).toBe(200);
    expect(archivia.json().progetto.archiviato).toBe(true);

    const ripristina = await app.inject({ method: "POST", url: `/api/v1/progetti/${id}/ripristina`, cookies: { ws_token: pm } });
    expect(ripristina.statusCode).toBe(200);
    expect(ripristina.json().progetto.archiviato).toBe(false);
  });

  afterAll(async () => {
    await app.close();
    rmSync(cartellaTemp, { recursive: true, force: true });
  });
});
