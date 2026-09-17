---
version: 0.1.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 1
  producer: agent/GLM-5.3-Flash
  consumer: phase-3-plan (ASD iniziativa + piano E3) → phase-5-implement
  gate: gate_1_specify
---

# PRD — F05-activities-progress: Attività & Avanzamento (Epica E3)

> **Fonti**: backlog MVP E3 (`plans/features/F02-mvp-asd-backlog/plan.md`) · ASD F02 §8 (schema `tasks`, `task_dependencies`), §6.2 (AD-5 Zod shared, AD-6 avanzamento dominio) · requisiti RF-04..07 · mockup M1 (sezione "Scadenze imminenti") · fondazioni E1/E2 su `main`.

## 1. Contesto

Con E2 i progetti esistono ma sono contenitori vuoti: l'avanzamento in dashboard mostra "—". Terza iniziativa MVP: introduce le attività (il cuore del piano), le dipendenze, gli aggiornamenti di stato da parte dei membri e i KPI di riepilogo, popolando avanzamento progetti e sezione "Scadenze imminenti" della dashboard.

## 2. Scope (storie E3 del backlog ratificato)

| Storia | Contenuto | Stima |
|---|---|---|
| E3.1 | CRUD attività per progetto + dipendenze tra attività con validazione cicli (DFS/BFS nel dominio) | M |
| E3.2 | Update stato attività da membro assegnato: un membro può aggiornare solo le proprie assegnazioni (RBAC granulare) + test | S |
| E3.3 | API KPI riepilogo per progetto (completate/in corso/in ritardo/scadenze entro N giorni) + avanzamento % proiettato in `/progetti` + test | M |
| E3.4 | UI: sezione "Scadenze imminenti" e avvisi in dashboard (conforme M1) + avanzamento reale in tabella progetti | S |

## 3. Criteri di Accettazione

- CRUD attività: crea/leggi/aggiorna/cancella con validazione Zod; 400/401/403/404 coerenti; attività sempre legate a un progetto esistente
- Dipendenze: creare `A dipende da B` rifiuta cicli (400) e auto-dipendenza; eliminazione dipendenza consentita ai ruoli di scrittura
- Stato attività: `da-iniziare | in-corso | completata | in-ritardo`; membro assegnato può solo aggiornare `stato` e `lavorateOre` della propria attività
- KPI: endpoint riepilogo per progetto (conteggi per stato, scadenze entro 10 giorni), coerente con M1
- Avanzamento progetto calcolato dal dominio (AD-6, funzioni E2.4) e restituito nelle API progetti/attività
- UI: avanzamento % con barra in tabella progetti; sezione scadenze imminenti con avvisi colorati; tutto in italiano (i18n)
- `npm run lint/typecheck/test` verdi; test integrazione (CRUD, cicli, RBAC membro) + test unit cicli/avanzamento

## 4. Fuori Ambito

Gantt grafico e CPM (E4), assegnazioni membri (E6 — per E3.2 "membro assegnato" si usa la tabella `assignments` già in schema), export (E7).

## 5. Revision Log

- **2026-09-17** - v0.1.0 - agent/GLM-5.3-Flash - PRD da backlog E3 ratificato.
