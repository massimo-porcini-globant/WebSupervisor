---
version: 1.0.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 3
  producer: agent/GLM-5.3-Flash
  consumer: phase-5-implement (E1.1–E1.4)
  gate: gate_2_architecture
---

# ASD — F03-foundation-auth

> **ASD di sistema**: `docs/F02-mvp-asd-backlog/phase-3-plan/asd.md` (ratificato, v1.0.0) — tutte le decisioni AD-1..AD-8 restano valide e non viene introdotta nessuna nuova decisione architetturale. Questo documento aggiunge solo i dettagli specifici dell'epica E1.

## 1. Architettura dei workspaces (E1.1)

```
WebSupervisor/
├── package.json            # npm workspaces: client, server, shared
├── client/                 # React 18 + Vite (SPA)
│   └── src/
├── server/
│   └── src/
│       ├── domain/         # logica pura (nessuna dipendenza DB/UI)
│       ├── data/           # Drizzle: schema, migrations, db.ts
│       ├── plugins/        # auth(jwt), rbac, zod-validation
│       └── routes/         # /api/v1/*
└── shared/
    ├── types/              # tipi TS contratto API
    ├── schemas/            # schemi Zod condivisi (login, ruoli)
    └── i18n/               # dizionario it (E8 lo popola)
```

Script root: `build` (tsc + vite build), `lint` (eslint), `typecheck` (tsc --noEmit), `test` (vitest run), `dev` (concurrently: vite + tsx watch).

## 2. Sicurezza auth (E1.3, AD-2)

- `POST /auth/login`: body validato con schema Zod (`shared/schemas/auth.ts`); bcrypt compare (round ≥ 10); JWT HS256 firmato con `JWT_SECRET` da `.env` (mai committato; fornito `.env.example`).
- Cookie: `httpOnly`, `sameSite: strict`, `secure` in produzione, TTL 8 h.
- Errori: 401 generico (nessuna distinzione username/password errata — anti-enumeration).
- Rate limit login (es. `@fastify/rate-limit`, 5 tentativi/min per IP).

## 3. RBAC (E1.4)

Ruoli: `amministratore`, `project_manager`, `membro`, `osservatore` (tabella `users.ruolo`). Middleware `requireRole(...)` su ogni route di scrittura. Matrice di riferimento (test):

| Risorsa | Amm | PM | Membro | Oss. |
|---|---|---|---|---|
| GET progetti/attività | ✓ | ✓ | ✓ (solo assegnati) | ✓ |
| CUD progetti/attività | ✓ | ✓ | ✗ | ✗ |
| PATCH stato propria attività | ✓ | ✓ | ✓ | ✗ |
| Gestione utenti | ✓ | ✗ | ✗ | ✗ |

## 4. Schema DB (E1.2) — tabelle E1

```
users(id, username UNIQUE, password_hash, ruolo, attivo, creato_il)
```
Le restanti tabelle del §8 ASD (teams, members, projects, tasks, …) vengono definite nelle migrations iniziali ma usate dagli epic successivi.

## 5. Verifica (Gate 3 di questa iniziativa)

- Vitest: unit su plugin rbac + integrazione su login/logout/me (Fastify `inject`, DB in memoria).
- Test matrice permessi 4 ruoli × operazioni chiave.
- CI verde: lint, typecheck, test, build.

## 6. Revision Log

- **2026-09-17** - v1.0.0 - agent/GLM-5.3-Flash - ASD di iniziativa: eredità ASD F02 + dettagli E1 (AD-2/4/5 declinati). Nessuna deviazione architetturale.
