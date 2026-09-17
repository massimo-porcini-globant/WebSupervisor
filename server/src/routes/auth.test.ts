/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E1.3), consumer: gate_3 evidence, gate: gate_3_implementation}
Test integrazione login/logout/me (Fastify inject + DB in memoria su file temporaneo).
*/
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import { costruisceApp } from "../app.js";
import { schema, type Db } from "../data/db.js";
import type { FastifyInstance } from "fastify";

const segreto = "test-secret-per-vitest-non-usare-in-prod-123456";

describe("autenticazione (E1.3)", () => {
  let app: FastifyInstance;
  let db: Db;
  const cartellaTemp = mkdtempSync(path.join(tmpdir(), "ws-test-"));

  beforeAll(async () => {
    const costruito = await costruisceApp({
      percorsoDb: path.join(cartellaTemp, "test.db"),
      segretoJwt: segreto,
      eseguiMigrations: true,
    });
    app = costruito.app;
    db = costruito.db;
    await app.ready();
    await db.insert(schema.users).values([
      {
        username: "pm_test",
        passwordHash: await bcrypt.hash("Password1!", 10),
        ruolo: "project_manager",
        attivo: true,
        creatoIl: new Date().toISOString(),
      },
      {
        username: "disattivato",
        passwordHash: await bcrypt.hash("Password1!", 10),
        ruolo: "membro",
        attivo: false,
        creatoIl: new Date().toISOString(),
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
    rmSync(cartellaTemp, { recursive: true, force: true });
  });

  it("login valido restituisce 200, cookie e utente con ruolo", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { username: "pm_test", password: "Password1!" } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["set-cookie"]).toBeTruthy();
    const corpo = res.json();
    expect(corpo.utente).toMatchObject({ username: "pm_test", ruolo: "project_manager" });
  });

  it("login con password errata → 401 generico (anti-enumeration)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { username: "pm_test", password: "ErrataErr1" } });
    expect(res.statusCode).toBe(401);
    expect(res.json().errore).toBe("Credenziali non valide");
  });

  it("login con username inesistente → 401 generico", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { username: "inesistente", password: "Password1!" } });
    expect(res.statusCode).toBe(401);
    expect(res.json().errore).toBe("Credenziali non valide");
  });

  it("login utente disattivato → 401", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { username: "disattivato", password: "Password1!" } });
    expect(res.statusCode).toBe(401);
  });

  it("payload non valido → 400", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { username: "x", password: "1" } });
    expect(res.statusCode).toBe(400);
  });

  it("/auth/me senza cookie → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("/auth/me con cookie valido → 200 con utente", async () => {
    const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { username: "pm_test", password: "Password1!" } });
    const cookie = login.headers["set-cookie"] as string;
    const token = cookie.split(";")[0]!.split("=").slice(1).join("=");
    const res = await app.inject({ method: "GET", url: "/api/v1/auth/me", cookies: { ws_token: token } });
    expect(res.statusCode).toBe(200);
    expect(res.json().utente.username).toBe("pm_test");
  });

  it("logout cancella il cookie", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/logout" });
    expect(res.statusCode).toBe(200);
    expect((res.headers["set-cookie"] as string)).toContain("Max-Age=0");
  });

  it("health endpoint risponde", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().stato).toBe("ok");
  });
});
