/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.1), consumer: server.ts + test, gate: gate_3_implementation}
Costruzione applicazione Fastify (iniettabile per test, ASD §10). Migration drizzle all'avvio.
*/
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { creaDb, type Db } from "./data/db.js";
import { registraAuth } from "./plugins/auth.js";
import { registraRouteAuth } from "./routes/auth.js";
import { registraRouteProgetti } from "./routes/progetti.js";
import { registraRouteAttivita } from "./routes/attivita.js";
import { registraRouteGantt } from "./routes/gantt.js";
import { registraRouteTeam } from "./routes/team.js";
import { registraRouteAllocazione } from "./routes/allocazione.js";
import { registraRouteExport } from "./routes/export.js";

export interface OpzioniApp {
  percorsoDb: string;
  segretoJwt: string;
  eseguiMigrations?: boolean;
}

export async function costruisceApp(opzioni: OpzioniApp): Promise<{ app: FastifyInstance; db: Db }> {
  const db = creaDb(opzioni.percorsoDb);

  const app = Fastify({ logger: false });
  await app.register(fastifyRateLimit, { max: 60, timeWindow: "1 minute" });
  await registraAuth(app, opzioni.segretoJwt);
  await app.register(
    async istanza => {
      await registraRouteAuth(istanza, db);
      await registraRouteProgetti(istanza, db);
      await registraRouteAttivita(istanza, db);
      await registraRouteGantt(istanza, db);
      await registraRouteTeam(istanza, db);
      await registraRouteAllocazione(istanza, db);
      await registraRouteExport(istanza, db);
    },
    { prefix: "/api/v1" }
  );

  app.get("/api/health", async () => ({ stato: "ok" }));

  app.addHook("onClose", async () => {
    (db.$client as { close: () => void }).close();
  });

  if (opzioni.eseguiMigrations) {
    const qui = path.dirname(fileURLToPath(import.meta.url));
    const cartellaMigrations = path.resolve(qui, "../drizzle");
    migrate(db, { migrationsFolder: cartellaMigrations });
  }

  return { app, db };
}
