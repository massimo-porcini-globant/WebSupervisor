---
version: 0.1.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 1
  producer: agent/GLM-5.3-Flash
  consumer: phase-3-plan (ASD iniziativa + piano E4) → phase-5-implement
  gate: gate_1_specify
---

# PRD — F06-gantt-cpm: Gantt & Percorso Critico (Epica E4)

> **Fonti**: backlog MVP E4 (`plans/features/F02-mvp-asd-backlog/plan.md`) · ASD F02 §6.2 (AD-1 frappe-gantt + CPM custom, AD-7 CPM server-side) · requisiti RF-08..13 · mockup M2 (`docs/F01-ui-mockups/phase-1-specify/mockups/gantt.html`) · fondazioni E1–E3 su `main`.

## 1. Contesto

Con E3 le attività esistono con dipendenze e KPI, ma senza rappresentazione temporale. Quarta iniziativa MVP: il Gantt è la funzione distintiva del prodotto (RF-08..13) — visualizzazione, manipolazione diretta delle date e calcolo del percorso critico.

## 2. Scope (storie E4 del backlog ratificato)

| Storia | Contenuto | Stima |
|---|---|---|
| E4.1 | API gantt: `GET /progetti/:id/gantt` (attività + fasi + flag `critica`) + test integrazione | M |
| E4.2 | Integrazione frappe-gantt (AD-1): rendering attività/fasi/milestone, zoom giorno/settimana/mese, pagina dedicata `/gantt` | M |
| E4.3 | Drag & drop date su Gantt → PATCH persistente con conferma/annullo + test | M |
| E4.4 | Dipendenze: creazione/modifica da UI (modulo) + frecce frappe-gantt + validazione anti-ciclo (riuso E3) | M |
| E4.5 | CPM nel dominio (AD-7): forward/backward pass, margine, flag criticità + test unit esaustivi + overlay percorso critico in UI | L |

## 3. Criteri di Accettazione

- API gantt: restituisce attività, dipendenze, flag criticità; 401/404 coerenti
- CPM: durate in giorni calendario; forward pass (ES/EF), backward pass (LS/LF), margine = LS−ES; attività con margine 0 → `critica: true`; nessuna dipendenza → tutte critiche? no: tutte con margine = durata progetto residua; test con grafi noti (catena, parallelo, ROMPITORE di ciclo già impedito)
- Gantt renderizza attività, gruppi "fase" (da `tasks.fase`), milestone (attività a durata 0 o con flag dedicato? si usa attività con `inizio === fine` come milestone)
- Drag & drop: cambio data → conferma → PATCH `/attivita/:id` persiste; annullamento ripristina
- Frecce dipendenze visibili; creazione dipendenza da UI con validazione (ciclo → messaggio di errore)
- Overlay "Percorso critico": evidenzia attività critiche (barra rossa, come M2)
- `npm run lint/typecheck/test` verdi; test unit CPM esaustivi + test integrazione API

## 4. Fuori Ambito

Assegnazioni membri su Gantt (E6), export PDF/immagine, baseline/confronto piani, calendari con festività.

## 5. Revision Log

- **2026-09-17** - v0.1.0 - agent/GLM-5.3-Flash - PRD da backlog E4 ratificato.
