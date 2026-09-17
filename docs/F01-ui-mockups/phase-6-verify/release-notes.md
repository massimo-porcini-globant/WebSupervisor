---
version: 1.0.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 6
  producer: agent/GLM-5.3-Flash
  consumer: stakeholder (chiusura F01) / prossimo ciclo Specify
  gate: gate_4_release
---

# Release Notes — F01-ui-mockups

## Deliverable

4 mockup ad alta fedeltà delle schermate principali di WebSupervisor (RF-28), con navigatore di validazione:

| Schermata | File | Requisiti riflessi |
|---|---|---|
| Navigatore | `index.html` | RF-29 (stati), RF-30 (validazione) |
| M1 · Dashboard Progetti | `dashboard.html` | RF-03..07 |
| M2 · Diagramma di Gantt | `gantt.html` | RF-08..13 |
| M3 · Gestione Team | `team.html` | RF-14..16 |
| M4 · Allocazione Risorse | `allocation.html` | RF-18..21 |
| Design system + dati | `shared/styles.css`, `shared/data.js` | ASD §2.3–2.4 |

Verificato in italiano, consultabile su desktop e tablet (RNF-03, RNF-04).

## Evidenza di verifica

1. **Verifica automatizzata (T7)** — `mockups.test.mjs`: 7 file verificati su stati RF-29, scenari ASD §2.4 (in linea/a rischio/in ritardo, sovra-allocazione, critical path), design system (token semantici), lingua italiana, flow stamp. **PASS.**
2. **Verifica sintattica** — `node --check` su tutti gli script inline e su `shared/data.js`: **OK**.
3. **Validazione stakeholder (T8, RF-30)** — verifica manuale del operatore (Massimo Porcini, 2026-09-17) su `index.html` e le quattro schermate: **approvati senza modifiche richieste.**

## Decisioni di validazione

- Stati dell'interfaccia (vuoto / popolato / in ritardo / a rischio / sovra-allocazione) conformi al PRD §3.
- Trascinamento Gantt e pulsanti export/créazione: rappresentazioni statiche, funzionalità differite alle iniziative di sviluppo.
- Nessun feedback correttivo da integrare; requisiti congelati per l'MVP.

## Esito

**GO** — l'iniziativa F01-ui-mockups è chiusa; i requisiti UI sono congelati per la pianificazione dell'MVP. Le evidenze di validazione alimentano la fase Specify del prossimo ciclo (ASD completo dell'app, `g-e-asd-create`).
