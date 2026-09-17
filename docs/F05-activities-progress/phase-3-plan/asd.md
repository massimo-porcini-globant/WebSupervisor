---
version: 1.0.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 3
  producer: agent/GLM-5.3-Flash
  consumer: phase-5-implement (E3.1–E3.4)
  gate: gate_2_architecture
---

# ASD — F05-activities-progress

> **ASD di sistema**: `docs/F02-mvp-asd-backlog/phase-3-plan/asd.md` (ratificato) — AD-1..AD-8 validi, nessuna nuova decisione architetturale. Dettagli dell'epica E3.

## 1. API — Attività (E3.1/E3.2)

Base: `/api/v1`. Le attività appartengono a un progetto (`/progetti/:idProgetto/attivita`).

| Metodo | Route | Ruoli | Note |
|---|---|---|---|
| GET | `/progetti/:idProgetto/attivita` | tutti autenticati | elenco attività del progetto (con dipendenze) |
| POST | `/progetti/:idProgetto/attivita` | amm, PM | crea attività (validazione Zod, progetto esistente) |
| PATCH | `/attivita/:id` | amm, PM; membro assegnato solo `stato`+`lavorateOre` | modifica; membro non assegnato → 403 |
| DELETE | `/attivita/:id` | amm, PM | cancella attività (e relative dipendenze) |
| POST | `/attivita/:id/dipendenze` | amm, PM | `{ dependsOn: id }`; auto-dipendenza e cicli → 400 |
| DELETE | `/attivita/:id/dipendenze/:dependsOn` | amm, PM | rimuove dipendenza |

## 2. API — KPI riepilogo (E3.3)

`GET /progetti/:idProgetto/kpi` (tutti autenticati): `{ completate, inCorso, daIniziare, inRitardo, scadenzeProssime }` con scadenze entro 10 giorni (attività non completate con `fine <= oggi+10`). Inoltre `GET /progetti` arricchisce ogni progetto con `avanzamento` (% calcolata dal dominio AD-6 su attività+pesi) e `suggerimentoStato` (derivazione E2.4).

## 3. Contratto condiviso (AD-5)

`shared/src/schemas/attivita.ts`: `attivitaCreateSchema` (nome 1–120, fase ≤ 80 opzionale, inizio/fine ISO, fine ≥ inizio, stimaOre ≥ 0 opzionale), `attivitaPatchSchema` (parziale), `statoTaskSchema` (enum), `dipendenzaSchema` (`dependsOn` intero positivo). Tipi: `Attivita`, `KpiProgetto`, `ProgettoConAvanzamento` (Progetto + `avanzamento: number | null`).

## 4. Dominio (AD-6)

`server/src/domain/attivita.ts`:
- `rilevaCiclo(grafi)`: verifica se aggiungere l'arco `(task → dependsOn)` crea un ciclo (DFS con colori); puro, testato unitariamente.
- `calcolaKpiProgetto(oggi)`: conteggi per stato + scadenze entro 10 giorni (pure; `oggi` iniettato).

Riuso `calcolaAvanzamentoProgetto`/`derivaStatoProgetto` (E2.4).

## 5. RBAC granulare (E3.2)

Matrice per PATCH stato:

| Utente | Può modificare |
|---|---|
| amministratore / project_manager | tutto (nome, date, stato, stimaOre, lavorateOre) |
| membro assegnato (riga in `assignments` sull'attività) | solo `stato` + `lavorateOre` |
| membro non assegnato / osservatore | nessun campo → 403 |

## 6. UI (E3.4, conforme M1)

- Dashboard: colonna "Avanzamento" con barra (`.avanzamento` di M1) usando `avanzamento` delle API; sezione "Scadenze imminenti" con avvisi `.avviso` (in-ritardo/a-rischio) alimentata da `scadenzeProssime` dei progetti; i18n esteso (`it.progetti.scadenze`, ecc.).

## 7. Verifica (Gate 3)

- Unit: `rilevaCiclo` (catene, cicli diretti/indiretti, self-loop), `calcolaKpiProgetto` (date fisse).
- Integrazione: CRUD attività, dipendenze (ciclo 400), matrice RBAC membro assegnato/non assegnato, KPI, avanzamento progetti.
- CI verde: lint, typecheck, test, build.

## 8. Revision Log

- **2026-09-17** - v1.0.0 - agent/GLM-5.3-Flash - ASD di iniziativa: eredità ASD F02 + dettagli E3 (AD-5/AD-6 declinati). Nessuna deviazione architetturale.
