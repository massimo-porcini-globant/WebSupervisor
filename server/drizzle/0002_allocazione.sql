-- Migration F09-allocazione-risorse (E9.2, AD-17): FK esplicita utente↔membro.
ALTER TABLE `members` ADD `user_id` integer REFERENCES users (id);--> statement-breakpoint
CREATE INDEX `members_user_idx` ON `members` (`user_id`);
