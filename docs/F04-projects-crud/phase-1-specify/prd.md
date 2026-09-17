---
version: 0.1.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 1
  producer: agent/GLM-5.3-Flash
  consumer: phase-3-plan (ASD iniziativa + piano E2) → phase-5-implement
  gate: gate_1_specify
---

# PRD — F04-projects-crud: Gestione Progetti (Epica E2)

> **Fonti**: backlog MVP E2 (`plans/features/F02-mvp-asd-backlog/plan.md`) · ASD F02 §8 (schema `projects`), §6.2 (AD-5 Zod shared, AD-6 avanzamento nel dominio) · requisiti RF-01..03 · mockup M1 (`docs/F01-ui-mockups/phase-1-specify/mockups/dashboard.html`) · fondazioni E1 su `main`.

## 1. Contesto

Con F03 le fondamenta sono in `main` (auth JWT + RBAC, schema Drizzle, CI). Seconda iniziativa MVP: mette in produzione la prima feature di dominio — la gestione dei progetti — includendo la prima schermata UI reale (Dashboard, conforme al mockup M1 ratificato).

## 2. Scope (storie E2 del backlog ratificato)

| Storia | Contenuto | Stima |
|---|---|---|
| E2.1 | CRUD progetti (`POST/GET/PATCH/DELETE`-logico via `archiviato`): validazione Zod in `shared/`, RBAC (scrittura: amministratore+PM), archiviazione/ripristino | S |
| E2.2 | Elenco filtrabile (stato/priorità/team) + paginazione; endpoint `GET /progetti` con query params | M |
| E2.3 | UI Dashboard conforme M1: tabella progetti (stato/priorità/avanzamento), filtri, KPI strip, stati vuoto; client React + chiamate API autenticate | M |
| E2.4 | Calcolo avanzamento nel dominio (AD-6): % da attività completate/peso, indicatore stato progetto derivato + test unit | S |

## 3. Criteri di Accettazione

- API: crea/leggi/modifica/archivia progetto con validazione Zod; 400 payload invalido, 401 non autenticato, 403 ruolo insufficiente
- Filtri combinabili (stato + priorità + team) e paginazione (`page`, `pageSize` con metadati)
- Avanzamento calcolato nel dominio (`server/src/domain`), testato unitariamente; nessun calcolo in UI
- Dashboard rispecchia M1: KPI strip, righe con punto-stato, stato vuoto quando nessun progetto
- Archiviazione: logica (flag `archiviato`), i progetti archiviati escono dagli elenchi di default
- `npm run lint/typecheck/test` tutti verdi; test integrazione CRUD+filtri+RBAC e test unit avanzamento

## 4. Fuori Ambito

Attività/task del progetto (E3), Gantt (E4), associazione team↔progetti completa (E5.2), export (E7).

## 5. Revision Log

- **2026-09-17** - v0.1.0 - agent/GLM-5.3-Flash - PRD da backlog E2 ratificato.
