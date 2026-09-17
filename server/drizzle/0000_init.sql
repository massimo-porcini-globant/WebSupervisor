CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`ruolo` text NOT NULL,
	`attivo` integer DEFAULT true NOT NULL,
	`creato_il` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`ruolo` text NOT NULL,
	`email` text NOT NULL,
	`capacita_punti` integer NOT NULL DEFAULT 100,
	`team_id` integer REFERENCES teams (id)
);
--> statement-breakpoint
CREATE INDEX `members_team_idx` ON `members` (`team_id`);
--> statement-breakpoint
CREATE TABLE `member_absences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL REFERENCES members (id),
	`dal` text NOT NULL,
	`al` text NOT NULL,
	`motivo` text
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`descrizione` text,
	`priorita` text NOT NULL,
	`stato` text DEFAULT 'in-linea' NOT NULL,
	`inizio` text NOT NULL,
	`fine` text NOT NULL,
	`team_id` integer REFERENCES teams (id),
	`archiviato` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_stato_idx` ON `projects` (`stato`);
--> statement-breakpoint
CREATE INDEX `projects_team_idx` ON `projects` (`team_id`);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL REFERENCES projects (id),
	`nome` text NOT NULL,
	`fase` text,
	`inizio` text NOT NULL,
	`fine` text NOT NULL,
	`stato` text DEFAULT 'da-iniziare' NOT NULL,
	`stima_ore` integer,
	`lavorate_ore` integer DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX `tasks_project_idx` ON `tasks` (`project_id`);
--> statement-breakpoint
CREATE TABLE `task_dependencies` (
	`task_id` integer NOT NULL REFERENCES tasks (id),
	`depends_on` integer NOT NULL REFERENCES tasks (id),
	PRIMARY KEY(`task_id`, `depends_on`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL REFERENCES tasks (id),
	`member_id` integer NOT NULL REFERENCES members (id),
	`percento` integer NOT NULL,
	`dal` text NOT NULL,
	`al` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assignments_member_idx` ON `assignments` (`member_id`);
