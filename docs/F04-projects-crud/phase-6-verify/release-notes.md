<!--
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash, consumer: release clearance (Gate 4), gate: gate_4_release}
-->

# Release Notes — F04-projects-crud

## Versione
0.2.0-projects (E2.1–E2.4 + containerizzazione)

## Consegnato
- **E2.1 — CRUD progetti**: `POST/GET/PATCH /api/v1/progetti`, archiviazione/ripristino logica; validazione Zod condivisa (`shared/schemas/progetti.ts`); RBAC: scrittura amministratore+PM, lettura tutti.
- **E2.2 — Elenco filtrabile**: filtri combinabili `stato`/`priorita`/`teamId`/`archiviati` + paginazione (`page`/`pageSize` con metadati totale/page/pageSize).
- **E2.4 — Avanzamento nel dominio (AD-6)**: `server/src/domain/avanzamento.ts` — % pesata per stima ore e derivazione stato progetto (in-linea/a-rischio/in-ritardo), funzioni pure con `oggi` iniettato.
- **E2.3 — UI Dashboard (M1)**: schermata login, Dashboard conforme al mockup M1 (KPI strip, filtri a chip, tabella progetti con punto-stato/badge priorità/avanzamento, stato vuoto, modulo "Nuovo progetto" per ruoli in scrittura), i18n it esteso, design system F01.
- **Dockerizzazione**: `Dockerfile` server multi-stage (node:24 → slim, better-sqlite3 compilato in build), `client/Dockerfile` (Vite build → nginx con reverse proxy `/api`), `docker-compose.yml` (2 servizi + volume SQLite + healthcheck), seed idempotente all'avvio, porta 8080.

## Verifica
- lint: 0 errori / 0 warning · typecheck: 0 diagnostica
- test: 30/30 (auth 9, RBAC 4, avanzamento 11, progetti 9: CRUD+filtri+RBAC+archiviazione)
- build client OK
- Smoke E2E: seed → login → crea 201 → lista con filtri/paginazione → 401 senza auth → archivia/ripristino 200
- Docker live: `docker compose up -d` → health 200, login 200, CRUD 201/200 via proxy nginx, SPA servita su 8080

## Note operative
- **Docker**: `docker compose up -d --build` → app su `http://localhost:8080`; `JWT_SECRET` richiesto in `.env`; dati su volume `dati`.
- **Cookie `Secure`**: impostare `COOKIE_SECURE=true` solo dietro HTTPS (default false); bind host configurabile via `HOST` (default `127.0.0.1` in locale, `0.0.0.0` in container).
- **Utenti seed**: `admin`/`membro`/`osservatore` + password `CambiaQuesta1!` (da cambiare; cambio password previsto in iniziativa futura).
- Avanzamento in UI mostra "—" finché non esistono attività (E3).

## Deviazioni dal piano
- Nessuna deviazione architetturale. Aggiunte tecniche: flag `COOKIE_SECURE` (cookie Secure su http bloccava il login nei container), `HOST` configurabile, seed eseguito all'avvio del container.
