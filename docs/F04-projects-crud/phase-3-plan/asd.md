---
version: 1.0.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 3
  producer: agent/GLM-5.3-Flash
  consumer: phase-5-implement (E2.1–E2.4)
  gate: gate_2_architecture
---

# ASD — F04-projects-crud

> **ASD di sistema**: `docs/F02-mvp-asd-backlog/phase-3-plan/asd.md` (ratificato, v1.0.0) — AD-1..AD-8 restano validi; nessuna nuova decisione architetturale. Questo documento declina i dettagli dell'epica E2.

## 1. API — Progetti (E2.1/E2.2)

Base: `/api/v1` (prefisso registrato in `app.ts`, come per auth).

| Metodo | Route | Ruoli | Note |
|---|---|---|---|
| GET | `/progetti` | tutti (✓ autenticati) | filtri `stato`, `priorita`, `teamId`, `archiviati` (default `false`); paginazione `page`/`pageSize` (default 1/20, max 100) |
| POST | `/progetti` | amm, PM | corpo validato `progettoCreateSchema` |
| GET | `/progetti/:id` | tutti | 404 se inesistente |
| PATCH | `/progetti/:id` | amm, PM | modifica campi (nome, descrizione, priorita, stato, inizio, fine, teamId) |
| POST | `/progetti/:id/archivia` | amm, PM | set `archiviato = true` |
| POST | `/progetti/:id/ripristina` | amm, PM | set `archiviato = false` |

Convenzioni: risposta `{ progetto | progetti, totale, page, pageSize }`; errori `{ errore }` con 400 (Zod fallito) / 401 (non autenticato) / 403 (RBAC) / 404 (non trovato).

## 2. Contratto condiviso (AD-5)

`shared/src/schemas/progetti.ts`: `progettoSchema` (nome 1–120, descrizione ≤ 2000, priorità `bassa|media|alta`, stato `in-linea|a-rischio|in-ritardo`, date ISO `YYYY-MM-DD` con fine ≥ inizio, teamId facoltativo), `progettoCreateSchema`, `progettoPatchSchema` (`.partial()`), `filtriProgettiSchema`. Tipi derivati (`Progetto`, `ProgettoInput`, …) esportati da `shared/src/index.ts`. Schema DB `projects` (ASD F02 §8) invariato.

## 3. Dominio — avanzamento (E2.4, AD-6)

`server/src/domain/avanzamento.ts`, funzioni pure (nessuna dipendenza DB/UI):

- `calcolaAvanzamentoProgetto(attività)`: % = somma pesi attività completate / totale (peso = stima_ore se presente, altrimenti 1); nessuna attività → `null`.
- `derivaStatoProgetto({inizio, fine, avanzamento, oggi})`: `in-linea` se in corso e in ritmo, `a-rischio` se vicino a scadenza con avanzamento insufficiente, `in-ritardo` se oltre fine non completato.
- Test unit con date fisse (nessuna dipendenza da orologio reale: `oggi` iniettato).

Stato progetto restituito dalle API = valore persistito; la derivazione è usata per suggerimenti/aggiornamento (endpoint `PATCH` o ricalcolo on-read in E2.4 secondo piano attività).

## 4. UI — Dashboard (E2.3, conforme M1)

- `client/src/`: struttura minimale estesa — `api.ts` (fetch con credenziali cookie), `App.tsx` con routing semplice (login → dashboard), componenti `Dashboard`, `TabellaProgetti`, `KpiStrip`, `FiltriProgetti`, `StatoVuoto`.
- Dizionario it da `shared/src/i18n/it.ts`; stili coerenti col design system mockup (`docs/F01-ui-mockups/phase-1-specify/mockups/shared/styles.css`).
- Login: form che chiama `POST /api/v1/auth/login`; errore generico mostrato all'utente.
- Filtri: stato (tutti/in-linea/a-rischio/in-ritardo), priorità, team; KPI strip = conteggi per stato dal risultato filtrato.

## 5. Verifica (Gate 3)

- Integrazione (Fastify `inject` + DB temporaneo): CRUD completo, filtri+paginazione, archiviazione, matrice RBAC su `/progetti` (4 ruoli).
- Unit: `avanzamento.ts` (casi limite: zero attività, pesi misti, progetto in ritardo/a rischio).
- CI verde: lint, typecheck, test, build.

## 6. Revision Log

- **2026-09-17** - v1.0.0 - agent/GLM-5.3-Flash - ASD di iniziativa: eredità ASD F02 + dettagli E2 (AD-5/AD-6 declinati). Nessuna deviazione architetturale.
