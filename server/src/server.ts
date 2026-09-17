/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.1), consumer: runtime (node), gate: gate_3_implementation}
Avvio server: DB da DB_PATH (default server/data/app.db), secret da JWT_SECRET.
*/
import path from "node:path";
import { fileURLToPath } from "node:url";
import { costruisceApp } from "./app.js";

const qui = path.dirname(fileURLToPath(import.meta.url));
const percorsoDb = process.env.DB_PATH ?? path.resolve(qui, "../data/app.db");
const segreto = process.env.JWT_SECRET;

if (!segreto) {
  console.error("JWT_SECRET non impostato: copiare .env.example in .env e configurare i valori.");
  process.exit(1);
}

const { app } = await costruisceApp({ percorsoDb, segretoJwt: segreto, eseguiMigrations: true });

const porta = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
await app.listen({ port: porta, host });
process.stdout.write(`WebSupervisor API in ascolto su http://${host}:${porta}/api/v1\n`);
