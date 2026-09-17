# Initiative Plan: F06-gantt-cpm

---
initiative:
  id: F06-gantt-cpm
  type: feature
  status: completed
  owner: Massimo Porcini (Engineering)
  vendor: none
flow: {phase: 3, producer: agent/GLM-5.3-Flash, consumer: team, gate: gate_2_architecture}
---

## 1. Summary
F06-gantt-cpm - Epica E4 (RF-08..13): API gantt con criticita CPM (AD-7), UI Gantt frappe-gantt (AD-1) con zoom, drag&drop date, dipendenze e overlay percorso critico.
Initiative F06-gantt-cpm (feature) initialized.

## 2. Alignment
- **SDD Delivery Flow**: Governed by SDD-FLOW.md (or sdd-flow.md) and CONSTITUTION.md (or constitution.md).
- **Active Branch**: agent/006-gantt-cpm

## 3. Scope
- **In Scope**: E4.1 API gantt+criticita, E4.2 frappe-gantt rendering/zoom, E4.3 drag&drop persistente, E4.4 dipendenze UI, E4.5 CPM dominio+overlay.
- **Out of Scope**: assegnazioni su Gantt (E6), export immagine, baseline, festività.

## 4. Progress & Status
- [x] Gate 1: Specify (PRD) - PRD v0.1.0 (2026-09-17)
- [x] Gate 2: Architecture & Tasks (ASD & Plan ratified) - ASD v1.0.0 (2026-09-17)
- [x] Gate 3: Implementation & Tests
- [x] Gate 4: Verification & Release

### Task
- [ ] E4.5 CPM dominio (forward/backward pass) + test esaustivi
- [ ] E4.1 API gantt (critica) + test integrazione
- [ ] E4.2 UI frappe-gantt: rendering, fasi, milestone, zoom
- [ ] E4.3 Drag&drop date con PATCH persistente
- [ ] E4.4 Dipendenze da UI + frecce + validazione

### Work Log
- **2026-09-17T21:44:01Z** — Initiative initialized by Massimo Porcini (Engineering).