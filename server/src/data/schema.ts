/*
flow: {phase: 5-implement, producer: agent/GLT-5.3-Flash (E1.2), consumer: data layer, gate: gate_3_implementation}
Schema Drizzle — ASD F02 §8 (migration iniziale).
*/
import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  ruolo: text("ruolo", { enum: ["amministratore", "project_manager", "membro", "osservatore"] }).notNull(),
  attivo: integer("attivo", { mode: "boolean" }).notNull().default(true),
  creatoIl: text("creato_il").notNull(),
});

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull().unique(),
});

export const members = sqliteTable(
  "members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nome: text("nome").notNull(),
    ruolo: text("ruolo").notNull(),
    email: text("email").notNull(),
    competenze: text("competenze"),
    capacitaPunti: integer("capacita_punti").notNull().default(100),
    teamId: integer("team_id").references(() => teams.id),
  },
  t => [index("members_team_idx").on(t.teamId)]
);

export const memberAbsences = sqliteTable(
  "member_absences",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    dal: text("dal").notNull(),
    al: text("al").notNull(),
    motivo: text("motivo").notNull(),
    impattoPercento: integer("impatto_percento").notNull().default(100),
  },
  t => [index("member_absences_member_idx").on(t.memberId)]
);

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nome: text("nome").notNull(),
    descrizione: text("descrizione"),
    priorita: text("priorita", { enum: ["alta", "media", "bassa"] }).notNull(),
    stato: text("stato", { enum: ["in-linea", "a-rischio", "in-ritardo"] }).notNull().default("in-linea"),
    inizio: text("inizio").notNull(),
    fine: text("fine").notNull(),
    teamId: integer("team_id").references(() => teams.id),
    archiviato: integer("archiviato", { mode: "boolean" }).notNull().default(false),
  },
  t => [index("projects_stato_idx").on(t.stato), index("projects_team_idx").on(t.teamId)]
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
    nome: text("nome").notNull(),
    fase: text("fase"),
    inizio: text("inizio").notNull(),
    fine: text("fine").notNull(),
    stato: text("stato", { enum: ["da-iniziare", "in-corso", "completata", "in-ritardo"] })
      .notNull()
      .default("da-iniziare"),
    stimaOre: integer("stima_ore"),
    lavorateOre: integer("lavorate_ore").default(0),
  },
  t => [index("tasks_project_idx").on(t.projectId)]
);

export const taskDependencies = sqliteTable(
  "task_dependencies",
  {
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id),
    dependsOn: integer("depends_on")
      .notNull()
      .references(() => tasks.id),
  },
  t => [primaryKey({ columns: [t.taskId, t.dependsOn] })]
);

export const assignments = sqliteTable(
  "assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    percento: integer("percento").notNull(),
    dal: text("dal").notNull(),
    al: text("al").notNull(),
  },
  t => [index("assignments_member_idx").on(t.memberId)]
);
