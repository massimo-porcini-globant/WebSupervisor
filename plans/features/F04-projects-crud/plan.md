# Initiative Plan: F04-projects-crud

---
initiative:
  id: F04-projects-crud
  type: feature
  status: completed
  owner: Massimo Porcini (Engineering)
  vendor: none
flow: {phase: 3, producer: agent/GLM-5.3-Flash, consumer: team, gate: gate_2_architecture}
---

## 1. Summary
F04-projects-crud — Epica E2 del backlog MVP (RF-01..03): CRUD progetti, elenco filtrabile/paginato, UI Dashboard conforme M1, avanzamento nel dominio.

## 2. Alignment
- **SDD Delivery Flow**: Governed by SDD-FLOW.md and CONSTITUTION.md.
- **Active Branch**: agent/004-projects-crud
- **Artefatti**: PRD `docs/F04-projects-crud/phase-1-specify/prd.md` · ASD `docs/F04-projects-crud/phase-3-plan/asd.md` (eredita ASD F02, AD-1..AD-8)

## 3. Scope
- **In Scope**: E2.1 CRUD + archiviazione, E2.2 filtri/paginazione, E2.3 Dashboard UI (M1), E2.4 avanzamento dominio.
- **Out of Scope**: attività (E3), Gantt (E4), team (E5), allocazione (E6), export (E7).

## 4. Progress & Status
- [x] Gate 1: Specify (PRD) — PRD v0.1.0 (2026-09-17)
- [x] Gate 2: Architecture & Tasks (ASD & Plan ratified) — ASD v1.0.0 (2026-09-17)
- [x] Gate 3: Implementation & Tests — 30/30 test, lint 0, typecheck 0, build OK (2026-09-17)
- [x] Gate 4: Verification & Release — release-notes.md, smoke test OK + Docker live (2026-09-17)

### Task
- [x] E2.1 CRUD progetti (Zod shared) + RBAC + archiviazione/ripristino
- [x] E2.2 Elenco filtrabile (stato/priorità/team) + paginazione
- [x] E2.4 Dominio avanzamento (AD-6) + test unit
- [x] E2.3 UI Dashboard conforme M1 + login + filtri + KPI + stato vuoto

### Work Log
- **2026-09-17T20:49:46Z** — Initiative initialized by Massimo Porcini (Engineering).
- **2026-09-17** — Gate 1 PASSED (PRD); Gate 2 artefatti redatti (ASD iniziativa + piano).
