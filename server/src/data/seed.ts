/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.2), consumer: db locale, gate: gate_3_implementation}
Seed scenari mockup (ASD §2.4 F01): 4 utenti (uno per ruolo) + dati dimostrativi coerenti con i mockup.
*/
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { creaDb, schema } from "./db.js";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const qui = path.dirname(fileURLToPath(import.meta.url));
const percorsoDb = process.env.DB_PATH ?? path.resolve(qui, "../../data/app.db");
const db = creaDb(percorsoDb);
migrate(db, { migrationsFolder: path.resolve(qui, "../../drizzle") });

const hash = await bcrypt.hash("CambiaQuesta1!", 10);
const ora = new Date().toISOString();

const utenti = [
  ["admin", hash, "amministratore"],
  ["pm", hash, "project_manager"],
  ["membro", hash, "membro"],
  ["osservatore", hash, "osservatore"],
] as const;

const inseriti = await db
  .insert(schema.users)
  .values(utenti.map(([username, passwordHash, ruolo]) => ({ username, passwordHash, ruolo, attivo: true, creatoIl: ora })))
  .onConflictDoNothing()
  .returning();

process.stdout.write(`Seed completato: ${inseriti.length} utenti creati (password: CambiaQuesta1! — cambiarla al primo accesso).\n`);
