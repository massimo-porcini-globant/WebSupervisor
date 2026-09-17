# Initiative Plan: F05-activities-progress

---
initiative:
  id: F05-activities-progress
  type: feature
  status: in_progress
  owner: Massimo Porcini (Engineering)
  vendor: none
flow: {phase: 3, producer: agent/GLM-5.3-Flash, consumer: team, gate: gate_2_architecture}
---

## 1. Summary
F05-activities-progress — Epica E3 del backlog MVP (RF-04..07): CRUD attività + dipendenze anti-ciclo, update stato da membro assegnato, KPI riepilogo, UI scadenze + avanzamento.

## 2. Alignment
- **SDD Delivery Flow**: Governed by SDD-FLOW.md and CONSTITUTION.md.
- **Active Branch**: agent/005-activities-progress
- **Artefatti**: PRD `docs/F05-activities-progress/phase-1-specify/prd.md` · ASD `docs/F05-activities-progress/phase-3-plan/asd.md` (eredita ASD F02, AD-1..AD-8)

## 3. Scope
- **In Scope**: E3.1 CRUD attività+dipendenze, E3.2 RBAC membro assegnato, E3.3 KPI riepilogo + avanzamento in progetti, E3.4 UI scadenze/avanzamento (M1).
- **Out of Scope**: Gantt/CPM (E4), assegnazioni UI (E6), export (E7).

## 4. Progress & Status
- [x] Gate 1: Specify (PRD) — PRD v0.1.0 (2026-09-17)
- [x] Gate 2: Architecture & Tasks (ASD & Plan ratified) — ASD v1.0.0 (2026-09-17)
- [ ] Gate 3: Implementation & Tests
- [ ] Gate 4: Verification & Release

### Task
- [ ] E3.1 CRUD attività + dipendenze con validazione cicli
- [ ] E3.2 Update stato da membro assegnato (RBAC) + test
- [ ] E3.3 KPI riepilogo API + avanzamento in /progetti + test
- [ ] E3.4 UI scadenze imminenti e avanzamento (conforme M1)

### Work Log
- **2026-09-17T21:29:16Z** — Initiative initialized by Massimo Porcini (Engineering).
- **2026-09-17** — Gate 1 PASSED (PRD); artefatti Gate 2 redatti (ASD iniziativa + piano).
