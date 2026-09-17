# Initiative Plan: F02-mvp-asd-backlog

---
initiative:
  id: F02-mvp-asd-backlog
  type: feature
  status: in_progress
  owner: Massimo Porcini (Engineering)
  vendor: none
flow: {phase: 4, producer: agent/GLM-5.3-Flash, consumer: backlog approval (operator) → phase-5-implement, gate: gate_2_architecture}
---

## 1. Summary

Architettura completa dell'app (ASD 12 sezioni, AD-1..AD-8) e decomposizione dell'MVP ratificato in epiche, storie con criteri di accettazione e roadmap di stima per la prima release. "Done" = ASD + backlog ratificati (Gate 2), così da sbloccare lo sviluppo (Gate 3) delle iniziative successive.

## 2. Alignment

- **SDD Delivery Flow**: governed by `SDD-FLOW.md` and `CONSTITUTION.md`.
- **Active Branch**: `agent/002-mvp-asd-backlog`
- **Input**: `docs/F02-mvp-asd-backlog/phase-1-specify/prd.md` (Gate 1 PASSED) · `input/context/requisiti-web-project-manager-v1.0.md` · `docs/F01-ui-mockups/` (contratto UI)
- **Architecture**: `docs/F02-mvp-asd-backlog/phase-3-plan/asd.md`

## 3. Scope

- **In scope**: ASD completo dell'app, backlog MVP (epiche → storie), roadmap di stima di massima.
- **Out of scope**: implementazione (iniziative successive F03+), SSO/notifiche/export KPI (v1.1), punti §6 requisiti.

## 4. Backlog MVP (epiche e storie)

> Storia = criteri di accettazione + test; ogni storia viaggia con i propri test (Gate 3).
> Stime: S ≤ 2 gg · M ≤ 5 gg · L ≤ 10 gg (persona-giorno, indicativo).

### E1 — Fondamenta & Auth (RF-26/27)
- E1.1 Scaffold workspaces npm (`client`, `server`, `shared`), toolchain lint/typecheck/test, CI minimale — M
- E1.2 Schema DB + migrations Drizzle (entità §8 ASD) + seed scenari mockup — M
- E1.3 Login JWT (cookie httpOnly, bcrypt), logout, `GET /auth/me` + test integrazione — M
- E1.4 Middleware RBAC 4 ruoli + guardie route + test matrice permessi — M

### E2 — Gestione Progetti (RF-01..03)
- E2.1 CRUD progetti (validazione Zod) + archiviazione — S
- E2.2 Elenco filtrabile (stato/priorità/team) + paginazione — M
- E2.3 UI Dashboard: elenco progetti conforme M1 + filtri + KPI strip + stati vuoto — M
- E2.4 Calcolo avanzamento dominio (AD-6) + indicatori stato + test unit — S

### E3 — Attività & Avanzamento (RF-04..07)
- E3.1 CRUD attività + dipendenze (validazione cicli) — M
- E3.2 Update stato attività da membro assegnato (RBAC) + test — S
- E3.3 KPI riepilogo API (completate/in corso/in ritardo/scadenze) + test — M
- E3.4 UI scadenze imminenti e avvisi (conforme M1) — S

### E4 — Gantt (RF-08..13)
- E4.1 API gantt (attività + fasi + flag critical) + test integrazione — M
- E4.2 Integrazione frappe-gantt: rendering, fasi, milestone, zoom — M
- E4.3 Drag & drop date → PATCH persistente + conferme — M
- E4.4 Dipendenze: creazione/modifica + frecce + validazione — M
- E4.5 CPM nel dominio (forward/backward pass) + test unit esaustivi + overlay UI — L

### E5 — Team (RF-14..16)
- E5.1 CRUD membri + competenze + capacità + assenze — M
- E5.2 Team ↔ progetti (associazione) — S
- E5.3 UI Gestione Team conforme M3 (griglia membri, assenze) — M

### E6 — Allocazione Risorse (RF-18..21)
- E6.1 Assegnazioni membro↔attività (% e intervallo) + vincolo capacità dominio + test — M
- E6.2 API workload (carico per persona/team, rilevamento sovra-allocazione) + test — M
- E6.3 UI Allocazione conforme M4: piano settimanale, celle carico, alert sovra-allocazione — L

### E7 — Export Excel (RF-22/23)
- E7.1 Export attività (intestazioni, colori stato, filtri automatici — RF-25 base) + test file generato — M
- E7.2 Export piano allocazione + test — M

### E8 — Rifinitura MVP (RNF)
- E8.1 i18n it centralizzato + audit RNF-03 (4 browser) — M
- E8.2 Prestazioni: seed 500 attività, misurazione RNF-02, indici/virtualizzazione se necessario — M
- E8.3 Backup schedulato + health endpoint + log strutturato (RNF-07) — S

## 5. Progress & Status

- [x] Gate 1: Specify (PRD) — PASSED 2026-09-17
- [x] Gate 2: Architecture & Tasks (ASD + backlog ratificati) — PASSED 2026-09-17
- [ ] Gate 3: Implementation & Tests (iniziative F03+ derivate dal backlog)
- [ ] Gate 4: Verification & Release

### Work Log

- **2026-09-17** — Iniziativa inizializzata su `agent/002-mvp-asd-backlog`; PRD ratificato (Gate 1); ASD 12 sezioni + backlog MVP redatti (Gate 2).

## 6. Roadmap di stima (indicativa, 3 blocchi)

| Blocco | Epiche | Stima | Milestone |
|---|---|---|---|
| Release 0.1 — fondamenta | E1, E2 | ~3-4 sett | Login, ruoli, progetti CRUD, dashboard base |
| Release 0.2 — pianificazione | E3, E4 | ~4-5 sett | Gantt completo con CPM, avanzamento |
| Release 1.0 — MVP | E5, E6, E7, E8 | ~4-5 sett | Team, allocazione, export, rifiniture RNF |

Stima totale MVP: ~11-14 settimane persona (da affinare per iniziativa a Gate 1 di ciascuna).

## 7. Revision Log

- **2026-09-17** - v1.0.0 - agent/GLM-5.3-Flash - Backlog MVP ratificato con perimetro confermato dall'operatore.
