/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.4), consumer: gate_3 evidence, gate: gate_3_implementation}
Test RBAC: matrice 4 ruoli × operazioni (ASD F03 §3). Fastify inject + DB in memoria.
*/
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import { costruisceApp } from "../app.js";
import { schema } from "../data/db.js";
import { requireRole } from "./rbac.js";
import type { Ruolo } from "@ws/shared";
import type { FastifyInstance } from "fastify";

const segreto = "test-secret-per-vitest-non-usare-in-prod-123456";
const RUOLI: Ruolo[] = ["amministratore", "project_manager", "membro", "osservatore"];

describe("RBAC — middleware requireRole", () => {
  let app: FastifyInstance;
  const cartellaTemp = mkdtempSync(path.join(tmpdir(), "ws-rbac-"));

  beforeAll(async () => {
    const costruito = await costruisceApp({
      percorsoDb: path.join(cartellaTemp, "rbac.db"),
      segretoJwt: segreto,
      eseguiMigrations: true,
    });
    app = costruito.app;
    const db = costruito.db;

    app.get("/api/v1/test/gestione", { preHandler: [requireRole(app, "amministratore", "project_manager")] }, async () => ({ ok: true }));
    app.get("/api/v1/test/lettura", { preHandler: [requireRole(app, ...RUOLI)] }, async () => ({ ok: true }));
    app.get("/api/v1/test/solo-admin", { preHandler: [requireRole(app, "amministratore")] }, async () => ({ ok: true }));

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

  async function tokenDi(ruolo: Ruolo): Promise<string> {
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username: `utente_${ruolo}`, password: "Password1!" },
    });
    expect(login.statusCode).toBe(200);
    return (login.headers["set-cookie"] as string).split(";")[0]!.split("=").slice(1).join("=");
  }

  it("gestione: 200 per amministratore e project_manager, 403 per membro e osservatore", async () => {
    const attesi: Record<Ruolo, number> = { amministratore: 200, project_manager: 200, membro: 403, osservatore: 403 };
    for (const ruolo of RUOLI) {
      const res = await app.inject({ method: "GET", url: "/api/v1/test/gestione", cookies: { ws_token: await tokenDi(ruolo) } });
      expect(res.statusCode, ruolo).toBe(attesi[ruolo]);
    }
  });

  it("lettura: 200 per tutti i ruoli autenticati", async () => {
    for (const ruolo of RUOLI) {
      const res = await app.inject({ method: "GET", url: "/api/v1/test/lettura", cookies: { ws_token: await tokenDi(ruolo) } });
      expect(res.statusCode, ruolo).toBe(200);
    }
  });

  it("solo admin: 403 per gli altri ruoli", async () => {
    for (const ruolo of RUOLI.filter(r => r !== "amministratore")) {
      const res = await app.inject({ method: "GET", url: "/api/v1/test/solo-admin", cookies: { ws_token: await tokenDi(ruolo) } });
      expect(res.statusCode, ruolo).toBe(403);
    }
  });

  it("senza cookie: 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/test/gestione" });
    expect(res.statusCode).toBe(401);
  });

  afterAll(async () => {
    await app.close();
    rmSync(cartellaTemp, { recursive: true, force: true });
  });
});
