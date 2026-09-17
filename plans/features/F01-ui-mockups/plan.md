# Initiative Plan: F01-ui-mockups

---
initiative:
  id: F01-ui-mockups
  type: feature
  status: completed
  owner: Massimo Porcini (Engineering)
  vendor: none
flow: {phase: 3, producer: agent/GLM-5.3-Flash, consumer: phase-5-implement (mockup build), gate: gate_2_architecture}
---

## 1. Summary

Produzione e validazione di 4 mockup ad alta fedeltà (Dashboard, Gantt, Team, Allocazione Risorse) come richiesto dai requisiti RF-28..RF-30, come passo obbligato prima dello sviluppo dell'app WebSupervisor (API-first + SPA). "Done" = mockup approvati dagli stakeholder dopo raccolta feedback.

## 2. Alignment

- **SDD Delivery Flow**: Governed by `SDD-FLOW.md` and `CONSTITUTION.md`.
- **Active Branch**: `agent/001-ui-mockups`
- **Input**: `docs/F01-ui-mockups/phase-1-specify/prd.md` (Gate 1 PASSED) · `input/context/requisiti-web-project-manager-v1.0.md`
- **Architecture**: `docs/F01-ui-mockups/phase-3-plan/asd.md` (ASD proporzionato, decisione operator)

## 3. Scope

- **In Scope**: 4 mockup HTML/CSS statici con dati fittizi (M1 Dashboard, M2 Gantt, M3 Team, M4 Allocazione), stati UI richiesti da RF-29, navigatore mockup, validazione stakeholder.
- **Out of Scope**: implementazione funzionale (API/DB), login (RF-26), export Excel reale (RF-22..25), app mobile.

## 4. Tasks

| # | Task | Output | Note |
|---|---|---|---|
| T1 | Design system + dati fittizi condivisi | `mockups/shared/styles.css`, `shared/data.js` | Token semantici stato (in linea/a rischio/in ritardo); scenari richiesti da ASD §2.4 |
| T2 | M1 — Dashboard Progetti | `mockups/dashboard.html` | RF-03..07; stati: vuota, popolata, a rischio, scadenze imminenti |
| T3 | M2 — Diagramma di Gantt | `mockups/gantt.html` | RF-08..13; dipendenze, critical path, zoom (rappresentazione) |
| T4 | M3 — Gestione Team | `mockups/team.html` | RF-14..17; anagrafica, disponibilità %, assenze |
| T5 | M4 — Allocazione Risorse | `mockups/allocation.html` | RF-18..21; sovra-allocazione evidenziata, carico persona/team |
| T6 | Navigatore mockup | `mockups/index.html` | Flussi user story §5 PRD |
| T7 | Verifica stati + browser | evidenza in `docs/F01-ui-mockups/phase-6-verify/` | Checklist PRD §7; 4 browser (RNF-03) |
| T8 | Validazione stakeholder + iterazione feedback | mockup aggiornati | RF-30; checkpoint umano |

## 5. Progress & Status

- [x] Gate 1: Specify (PRD / Brief) — PASSED 2026-09-17
- [x] Gate 2: Architecture & Tasks (ASD & Plan ratified) — PASSED 2026-09-17
- [ ] Gate 3: Implementation & Tests (T1–T7)
  - [x] T1 Design system + dati fittizi (`shared/styles.css`, `shared/data.js`)
  - [x] T2 M1 Dashboard (`dashboard.html`)
  - [x] T3 M2 Gantt (`gantt.html`) — fasi, dipendenze, critical path, zoom, drag rappresentato
  - [x] T4 M3 Team (`team.html`)
  - [x] T5 M4 Allocazione (`allocation.html`)
  - [x] T6 Navigatore (`index.html`)
  - [x] T7 Verifica stati + browser (test automatizzato `mockups.test.mjs` PASS; sintassi JS verificata; validazione manuale operatore su 4 schermate)
  - [x] T8 Validazione stakeholder + iterazione feedback — approvati senza modifiche (RF-30)
- [x] Gate 4: Verification & Release — PASSED 2026-09-17 (release-notes.md con evidenza GO)

### Work Log

- **2026-09-17T15:08:40Z** — Initiative initialized by Massimo Porcini (Engineering).
- **2026-09-17** — Gate 1 passed (PRD ratified). ASD proporzionato redatto (decisione operator: deviazione proporzionalità documentata in asd.md). Branch re-bound a `agent/001-ui-mockups`.
- **2026-09-17** — Gate 2 passed (ASD + piano). T1–T6: mockup costruiti con skill `frontend-design` (design system "salagioni", 4 schermate + navigatore, toggle stati popolato/vuoto). Verifica sintassi JS superata (node --check).
- **2026-09-17** — Gate 3 passed: test automatizzato mockups.test.mjs (stati RF-29, scenari ASD, design system, lingua). Gate 4 passed: validazione manuale operatore (approvazione 2026-09-17) + release-notes con esito GO. Iniziativa completata.

## 6. Revision Log

- **2026-09-17** - v0.2.0 - agent/GLM-5.3-Flash - Piano popolato con task T1–T8, scope, allineamento ASD/PRD.
