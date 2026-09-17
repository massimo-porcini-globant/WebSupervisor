---
version: 0.1.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 3
  producer: agent/GLM-5.3-Flash
  consumer: phase-4-tasks (plan) / phase-5-implement
  gate: gate_2_architecture
---

# ASD — F01-ui-mockups: Architettura del Prototipo UI

> **Nota di proporzionalità** (deviazione documentata, decisione operator 2026-09-17): per l'iniziativa F01 (prototipo UI, RF-28..RF-30) l'ASD è ridotto a file unico con sezioni proporzionate. L'ASD completo a 12 sezioni dell'app (`g-e-asd-create`) è differito all'iniziativa di sviluppo MVP. Fonte: `docs/F01-ui-mockups/phase-1-specify/prd.md` (Gate 1 PASSED).

## 1. Contesto

WebSupervisor (gestione progetti: dashboard avanzamento, Gantt, team, allocazione, export Excel) richiede mockup ad alta fedeltà prima dello sviluppo (RF-28). Questo ASD definisce l'architettura del **solo prototipo UI**: i mockup non producono codice applicativo client/server e non entreranno in produzione.

## 2. Architettura del Prototipo

### 2.1 Forma del deliverable

- 4 mockup **HTML + CSS self-contained** (uno per schermata), con dati fittizi statici hardcoded nel markup/script di demo.
- Nessun bundler, nessun framework, nessuna dipendenza runtime: file statici apribili in browser (RNF-03: Chrome, Edge, Firefox, Safari).
- Navigazione tra schermate tramite link semplici (M1 → M2/M3/M4 e ritorno) per riprodurre i flussi delle user story.

### 2.2 Struttura file

```
docs/F01-ui-mockups/phase-1-specify/mockups/
├── index.html            # Navigatore mockup (entry point)
├── shared/
│   ├── styles.css        # Design system: token, componenti base
│   └── data.js           # Dati fittizi condivisi (progetti, attività, membri)
├── dashboard.html        # M1 — Dashboard Progetti
├── gantt.html            # M2 — Diagramma di Gantt
├── team.html             # M3 — Gestione Team
└── allocation.html       # M4 — Allocazione Risorse
```

### 2.3 Design system (styles.css)

- **Token**: palette semantica `in linea` (verde), `a rischio` (ambra), `in ritardo` (rosso); scala grigi; tipografia leggibile (RNF-01).
- **Componenti base**: card progetto, badge di stato, tabella attività, timeline Gantt (barre CSS), avatar/tag competenze, barra carico di lavoro, pulsante "Esporta Excel" (rappresentazione, RF-22..25).
- **Layout**: header con navigazione principale + area contenuto; consultabile su tablet (RNF-04, media query ≥ 768px).

### 2.4 Dati fittizi (data.js)

Modello di dati allineato ai requisiti funzionali (base per il futuro schema SQLite a Gate 2 dell'app):
- `projects`: id, nome, descrizione, dataInizio, dataFine, priorità, stato
- `tasks`: id, projectId, nome, fase/milestone, dataInizio, dataFine, stato, dipendenze[], assegnatari[]
- `members`: id, nome, ruolo, competenze[], email, capacità%, assenze[]
- `allocations`: memberId, taskId, %, intervallo temporale

Scenari fittizi obbligatori: ≥ 1 progetto in linea, ≥ 1 a rischio, ≥ 1 in ritardo; ≥ 1 membro sovra-allocato (>100% capacità); casi "vuoto" gestiti da pagine/stati dedicati o toggle.

## 3. Decisioni Architetturali

| # | Decisione | Scelta | Razionale |
|---|---|---|---|
| AD-1 | Tecnologia mockup | HTML+CSS statici, zero dipendenze | Semplicità (Principio I), validazione immediata da stakeholder, zero barriere di esecuzione |
| AD-2 | Stile visivo | Skill `frontend-design` (Anthropic), design professionale Pulito e orientato alla produttività | RF-28 richiede esplicitamente le capacità frontend design di Anthropic |
| AD-3 | Stati UI | Replicati via varianti di dati fittizi + indicatori semantici | RF-29 richiede stati vuoto/popolato/ritardo/sovra-allocazione |
| AD-4 | Lingua | Italiano hardcoded nei mockup | RNF-08 (i18n preparata nello sviluppo reale, non nel prototipo) |
| AD-5 | Interattività | Solo rappresentazione (hover/focus leggeri); drag&drop Gantt simulato visivamente | Il mockup valida l'esperienza, non il comportamento (RF-09 coperto dallo sviluppo) |

## 4. Vincoli

- Nessun codice in `client/`, `server/`, `shared/` (Gate 2 barrier dell'app resta valido).
- I mockup vivono esclusivamente in `docs/` (artefatti di specifica).
- Validazione stakeholder richiesta prima della chiusura (RF-30) — checkpoint umano.

## 5. Verifica (Testing del prototipo)

- Verifica visuale/consultativa: ogni stato richiesto presente e identificabile (checklist §3 PRD).
- Apertura in tutti i 4 browser target (RNF-03) — verifica manuale documentata in `docs/F01-ui-mockups/phase-6-verify/`.
- Eventuale assistenza: skill `webapp-testing` (Playwright) per screenshot/verifica statica.

## 6. Revision Log

- **2026-09-17** - v0.1.0 - agent/GLM-5.3-Flash - Bozza ASD proporzionato per F01-ui-mockups (scelta operatore: ASD ridotto al prototipo UI).
