-- Migration F07-team-anagrafica (E5.2, AD-8): competenze membri + impatto assenze.
-- Nota: SQLite non supporta ALTER COLUMN; `motivo` resta nullable a livello DB e
-- viene reso obbligatorio dalla validazione Zod (assenzaSchema).
ALTER TABLE `members` ADD `competenze` text;--> statement-breakpoint
ALTER TABLE `member_absences` ADD `impatto_percento` integer NOT NULL DEFAULT 100;--> statement-breakpoint
CREATE INDEX `member_absences_member_idx` ON `member_absences` (`member_id`);
