/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.2), consumer: db locale, gate: gate_3_implementation}
Seed scenari mockup (ASD §2.4 F01): 4 utenti (uno per ruolo) + dati dimostrativi coerenti con i mockup.
*/
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { creaDb, schema } from "./db.js";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";

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

// E9.2 (AD-17): team + membro demo collegato via FK user_id, con assegnazioni demo per
// esercitare piano/sovra-allocazione/carico (RF-18..21). Idempotente.
const [teamDemo] = await db.insert(schema.teams).values({ nome: "Demo" }).onConflictDoNothing().returning();
if (teamDemo) {
  const [utenteMembro] = await db.select().from(schema.users).where(eq(schema.users.username, "membro"));
  const [membroDemo] = await db
    .insert(schema.members)
    .values({ nome: "membro", ruolo: "Sviluppatore", email: "membro@example.it", capacitaPunti: 80, teamId: teamDemo.id, userId: utenteMembro?.id ?? null })
    .returning();
  const [progettoDemo] = await db
    .insert(schema.projects)
    .values({ nome: "Progetto Demo", priorita: "media", inizio: "2026-09-01", fine: "2026-12-31", teamId: teamDemo.id })
    .returning();
  if (progettoDemo && membroDemo) {
    const attivitaDemo = await db
      .insert(schema.tasks)
      .values([
        { projectId: progettoDemo.id, nome: "Sviluppo front-end", inizio: "2026-09-14", fine: "2026-09-18", fase: "Analisi" },
        { projectId: progettoDemo.id, nome: "App Prenotazioni", inizio: "2026-09-14", fine: "2026-09-18", fase: "Sviluppo" },
      ])
      .returning();
    if (attivitaDemo.length === 2) {
      await db.insert(schema.assignments).values([
        { taskId: attivitaDemo[0]!.id, memberId: membroDemo.id, percento: 60, dal: "2026-09-14", al: "2026-09-18" },
        { taskId: attivitaDemo[1]!.id, memberId: membroDemo.id, percento: 60, dal: "2026-09-14", al: "2026-09-18" },
      ]);
    }
  }
}

process.stdout.write(`Seed completato: ${inseriti.length} utenti creati (password: CambiaQuesta1! — cambiarla al primo accesso).\n`);
