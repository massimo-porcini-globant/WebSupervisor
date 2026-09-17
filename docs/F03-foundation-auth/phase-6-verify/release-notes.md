<!--
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash, consumer: release clearance (Gate 4), gate: gate_4_release}
-->

# Release Notes — F03-foundation-auth

## Versione
0.1.0-foundation (E1.1–E1.4)

## Consegnato
- **E1.1 — Fondazioni monorepo**: npm workspaces `client/` `server/` `shared/`, toolchain TypeScript ES2022, ESLint flat config, Prettier, Vitest, CI GitHub Actions (lint + typecheck + test su push/PR).
- **E1.2 — Schema DB**: SQLite via better-sqlite3 + Drizzle ORM (AD-4). Migration iniziale `0000_init` (users, teams, members, member_absences, projects, tasks, task_dependencies, assignments). Seed scenari mockup (4 utenti, uno per ruolo).
- **E1.3 — Autenticazione**: Fastify 5, JWT HS256 in cookie httpOnly SameSite=strict (AD-2), bcrypt, login/logout/me su `/api/v1/auth/*`, 401 generico anti-enumeration, rate limit 60/min, Zod shared (AD-5).
- **E1.4 — RBAC**: middleware `requireRole` (4 ruoli: amministratore, project_manager, membro, osservatore), matrice permissi ASD F03 §3 testata.

## Verifica
- lint: 0 errori / 0 warning
- typecheck: 0 diagnostica (shared + server + client)
- test: 13/13 passati (auth 9, RBAC 4)
- build: client Vite OK
- smoke test manuale: seed → login 200 → /me 200 → logout con cookie pulito

## Note operative
- Configurazione da `.env` (vedi `.env.example`): `DB_PATH`, `JWT_SECRET`, `PORT`.
- Dev: `npm run dev` (client 5173 + server 3000, proxy `/api`); seed: `npm run seed`.
- Password iniziale utenti seed: `CambiaQuesta1!` (da cambiare al primo accesso).

## Deviazioni dal piano
- `@fastify/jwt` aggiornato a v10 (vulnerabilità critiche fast-jwt; API `jwtVerify` usa `onlyCookie`).
- `better-sqlite3` v13 per prebuild Node 24; drizzle-orm ≥0.45.2 (fix SQL injection GHSA-gpj5-g38j-94v9).
