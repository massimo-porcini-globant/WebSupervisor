---
version: 1.0.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 3
  producer: agent/GLM-5.3-Flash
  consumer: phase-4-tasks (backlog MVP) / phase-5-implement
  gate: gate_2_architecture
---

# ASD — WebSupervisor: Architettura dell'Applicazione (API-first + SPA)

> **Nota di processo**: ASD in formato monolite-file (12 sezioni) al path richiesto dal gate, anziché la cartella multi-file `.globant-skills-docs/asd/` di `g-e-asd-create` — deviazione di forma concordata (contenuto completo, struttura adattata al SDD gate). Fonti: PRD F02 (Gate 1 PASSED), requisiti v1.0, mockup F01 approvati.
> **Perimetro MVP ratificato** (operatore, 2026-09-17): PRD §3.

## Revision Log

- **2026-09-17** - v1.0.0 - agent/GLM-5.3-Flash - ASD completo redatto; decisioni AD-1..AD-8 ratificate dall'operatore (perimetro MVP confermato).

---

## 1. Context

WebSupervisor è una web application per la gestione dei progetti: dashboard di avanzamento, pianificazione su Gantt, gestione team, allocazione risorse ed export Excel. Destinatari: project manager, team leader, membri del team, management. Architettura **API-first + SPA**: il backend Fastify è headless (API REST JSON), il client React è disaccoppiato e vi accede via HTTP. Ruoli: Amministratore, Project Manager, Membro del team, Osservatore.

## 2. Functional Overview

Moduli funzionali (dal documento requisiti e mockup approvati):

- **Auth & Ruoli** (RF-26/27): login username/password, sessione JWT, RBAC server-side a 4 ruoli.
- **Progetti** (RF-01..03): CRUD + archiviazione, elenco filtrabile per stato/priorità/team.
- **Avanzamento** (RF-04..07): calcolo automatico % (attività completate/totali), KPI, indicatori in linea/a rischio/in ritardo, scadenze.
- **Gantt** (RF-08..13): timeline interattiva, dipendenze, drag & drop date, fasi/milestone, zoom, critical path (CPM).
- **Team** (RF-14..16): anagrafica membri, competenze, capacità, assenze; team → progetti.
- **Allocazione** (RF-18..21): assegnazioni attività, piano settimanale, sovra-allocazione, carico persona/team.
- **Export** (RF-22/23): Excel attività e piano allocazione (exceljs).
- Notifiche (RF-17), SSO, export KPI (RF-24/25): **v1.1**.

### 2.1 Moduli

```
client (SPA React)           server (Fastify)
├── auth                     ├── routes/auth
├── dashboard                ├── routes/projects
├── gantt                    ├── routes/tasks (+CPM)
├── team                     ├── routes/members, teams
├── allocation               ├── routes/allocations
└── export                   └── routes/export (exceljs)
```

## 3. NFR (dai requisiti RNF-01..08)

| ID | Vincolo | Risposta architetturale |
|---|---|---|
| RNF-01 | Usabilità senza formazione | UI conforme ai mockup F01; vocabolario coerente (frontend-design §writing) |
| RNF-02 | Dashboard/Gantt ≤ 2-3 s @ 500 attività | SQLite WAL + indici; API paginate; rendering virtualizzato sul Gantt |
| RNF-03 | Browser desktop principali | Target ES2022, test Chrome/Edge/Firefox/Safari |
| RNF-04 | Tablet in consultazione | Media query (mockup F01 ≥ 768px), sola lettura < 1024px |
| RNF-05 | HTTPS + accessi autenticati | JWT in cookie httpOnly/Secure/SameSite; helmet; CORS ristretto |
| RNF-06 | Scalabilità senza degrado | Monolite modulare stateless (scalabile orizzontalmente), SQLite per v1 |
| RNF-07 | Backup periodico | Backup schedulato del file SQLite (litestream o copia + WAL checkpoint) |
| RNF-08 | Italiano, i18n pronto | Dizionario UI centralizzato (`shared/i18n/`), dati localizzabili |

## 4. Constraints

- Stack vincolato (Costituzione §3.1): TS/Node 20, React 18+Vite, Fastify, SQLite, Vitest, npm.
- Modalità Supervised + Gate SDD per ogni iniziativa.
- Mockup F01 = contratto UI.
- Fuori scope v1.0: time tracking, fatturazione, mobile nativo, documentale (req. §6).

## 5. Principles

1. **Semplicità** (Costituzione I): monolite modulare, niente microservizi.
2. **Sicurezza zero-trust**: validazione schema su ogni input (Zod), query parametrizzate, RBAC server-side, secrets in `.env` mai committati.
3. **Contratto API-first**: `shared/` contiene tipi TS e schemi Zod condivisi client/server (single source of truth).
4. **Test a ogni livello**: unit (Vitest) su dominio puro, integrazione su API, component test su UI critica.
5. **UI = contratto F01**: design system "salagioni" dei mockup è la reference per il client.

## 6. Software Architecture

### 6.1 Stile

Monolite modulare: un processo Fastify, moduli interni separati (routes → domain → data), SPA statica servita in produzione dallo stesso Fastify (static files) o da CDN. Comunicazione REST JSON.

```
Browser (React/Vite SPA)
   │  HTTPS, cookie JWT
   ▼
Fastify (API /api/v1)
   ├── plugins: auth(jwt), rbac, schema-validation(zod), rate-limit
   ├── domain/   ← logica pura: avanzamento, CPM, allocazione
   └── data/     ← Drizzle ORM → SQLite (WAL)
```

### 6.2 Decisioni architetturali

| # | Decisione | Scelta | Razionale |
|---|---|---|---|
| AD-1 | Libreria Gantt | **frappe-gantt** (MIT) + calcolo critical path custom | Supporta drag&drop, dipendenze, milestone, zoom; CP calcolato dal dominio server e overlay client. Alternative scartate: dhtmlx (commerciale), custom SVG (costo elevato) |
| AD-2 | Autenticazione | **fastify-jwt + cookie httpOnly + bcrypt** | Semplice, sicuro, testabile; SSO v1.1 via OAuth2 plugin |
| AD-3 | Export Excel | **exceljs** | MIT, formattazione celle/intestazioni/filtri (RF-25), streaming |
| AD-4 | Accesso dati | **Drizzle ORM + better-sqlite3** | Type-safe, migration versionate, prepared statements (Principio II); escape hatch SQL nativo per query Gantt complesse |
| AD-5 | Validazione | **Zod** condiviso in `shared/` | Schema unici client/server per form e API |
| AD-6 | Avanzamento | Calcolo nel dominio server (`server/src/domain/progress.ts`): % = completate/totali; stato = regole su date/ritardo | Coerenza con RF-05; testabile al 100% |
| AD-7 | Critical path | CPM (forward/backward pass) nel dominio su grafo dipendenze | RF-11; il client riceve flag `critica` |
| AD-8 | i18n | dizionario `shared/i18n/it.ts`, layout predisposto per aggiungere lingue | RNF-08 |

### 6.3 API (principali endpoint)

```
POST /api/auth/login | POST /api/auth/logout | GET /api/auth/me
GET/POST/PATCH /api/projects        (+ /archive)
GET/POST/PATCH/DELETE /api/tasks    (+ dipendenze)
GET /api/projects/:id/gantt         (attività + fasi + critical flag)
GET /api/kpi/summary
GET/POST/PATCH/DELETE /api/members  (+ team)
GET/POST/PATCH/DELETE /api/allocations
GET /api/workload?from&to&member|team
GET /api/export/tasks.xlsx | /api/export/allocation.xlsx
```

RBAC: PM = scrittura su progetti/team/allocazioni; Membro = update stato proprie attività; Osservatore = lettura.

## 7. Infrastructure Architecture

- **Ambienti**: dev (locale), produzione (VM/container Linux con Node 20).
- SPA statica servita da Fastify `@fastify/static` (deploy unico).
- HTTPS via reverse proxy (nginx/Caddy) in produzione; TLS terminato lì (RNF-05).
- **Backup**: cron giornaliero — copia file DB + `PRAGMA wal_checkpoint(TRUNCATE)` (RNF-07).
- Diagramma: `Browser → reverse proxy (TLS) → Fastify → SQLite (volume persistente)`.

## 8. Data Architecture

SQLite (WAL), Drizzle ORM, migration in repo. Schema MVP:

```
users(id, username UNIQUE, password_hash, ruolo, attivo)
teams(id, nome)
members(id, nome, ruolo, email, capacita_punti, team_id FK)
member_absences(id, member_id FK, dal, al, motivo)
projects(id, nome, descrizione, priorita, stato, inizio, fine, team_id FK, archiviato)
tasks(id, project_id FK, nome, fase, inizio, fine, stato, stima_ore, lavorate_ore)
task_dependencies(task_id FK, depends_on FK, PK(task_id, depends_on))
assignments(task_id FK, member_id FK, percento, dal, al)
```

Regole: query parametrizzate (Drizzle); % allocazione validata vs capacità (vincolo dominio, non solo UI); avanzamento progetto = f(attività) calcolata, mai persistita (AD-6).

## 9. DevOps (CI/CD)

- **CI** (GitHub Actions o equivalente): lint → typecheck → test → build su ogni PR; merge vietato se rosso (gate PR Review).
- **CD**: build immagine/container o pacchetto node + migrazione automatica all'avvio; tag semver.
- Qualità: ESLint flat config, Prettier, Vitest coverage threshold in CI.

## 10. Testing Principles

- **Piramide**: unit (dominio: progress, CPM, workload, validazioni — 100% logica di business), integration (Fastify inject + DB di test in memoria), component (React Testing Library su schermate chiave), E2E Playwright sui 5 flussi user story (post-MVP opzionale in v1).
- Ogni storia porta i propri test (Gate 3); fixture dati coerenti con scenari mockup (in linea/a rischio/in ritardo/sovra-allocazione).

## 11. Operations & Support

- Log strutturato (pino), health endpoint `/api/health`.
- Recovery: ripristino backup SQLite documentato; RPO 24 h (accettato per MVP).

## 12. Digital Transformation Capabilities

Non applicabile a questa release (nessun componente AI/transformation richiesto dai requisiti v1.0). Riesaminare in v1.1+.
