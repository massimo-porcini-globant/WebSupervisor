/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.2), consumer: app/server, gate: gate_3_implementation}
Connessione SQLite (WAL). Path DB iniettabile (test in memoria, ASD §10). Schema in schema.ts.
*/
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export function creaDb(percorsoDb: string) {
  mkdirSync(dirname(percorsoDb), { recursive: true });
  const db = new Database(percorsoDb);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return drizzle(db, { schema });
}

export { schema };
export type Db = ReturnType<typeof creaDb>;
