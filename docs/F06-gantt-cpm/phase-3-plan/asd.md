---
version: 1.0.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 3
  producer: agent/GLM-5.3-Flash
  consumer: phase-5-implement (E4.1–E4.5)
  gate: gate_2_architecture
---

# ASD — F06-gantt-cpm

> **ASD di sistema**: `docs/F02-mvp-asd-backlog/phase-3-plan/asd.md` (ratificato) — AD-1 (frappe-gantt + CPM custom) e AD-7 (CPM server-side) validi. Dettagli dell'epica E4.

## 1. Dominio — CPM (E4.5, AD-7)

`server/src/domain/cpm.ts` (funzioni pure, durate in giorni calendario, date ISO):

```
cpm( attivita: {id, inizio, fine}[], dipendenze: {taskId, dependsOn}[] )
  → Map<id, { earlyStart, earlyFinish, lateStart, lateFinish, margine, critica }>
```

- Durata attività = giorni calendario `fine − inizio` (inclusivo), min 1 (milestone `inizio === fine` → durata 1, trattata come attività).
- **Forward pass** in ordine topologico (Kahn): `ES = max(EF delle dipendenze)`; `EF = ES + durata − 1` (giorni inclusivi, aritmetica su date).
- **Backward pass** dal progetto: `LF = min(LS dei successori) − 1`; ultimo: `LF = max(EF)`; `LS = LF − durata + 1`.
- **Margine** = LS − ES; `critica = margine === 0`.
- Nessuna attività → mappa vuota. Test su grafi noti: catena, parallelo, rombo.

## 2. API — Gantt (E4.1)

`GET /progetti/:idProgetto/gantt` (tutti autenticati):

```json
{
  "attivita": [ { ...Attivita, "critica": true } ],
  "dipendenze": [{ "taskId": 2, "dependsOn": 1 }],
  "cpm": { "generatoIl": "...", "percorsiCritici": 1 }
}
```

Il flag `critica` proviene dal dominio CPM (AD-7: calcolo server-side). 401/404 come da convenzioni.

## 3. UI — Gantt (E4.2/E4.3/E4.4/E4.5, conforme M2)

- Dipendenza `frappe-gantt` (AD-1) in `client`; componente `SchermataGantt`:
  - rendering attività (barra), fasi come gruppi (attività con stessa `fase` → barra di gruppo generata client-side), milestone = attività con `inizio === fine` (icona rombo di frappe-gantt);
  - zoom: vista giorno/settimana/mese (bottoni);
  - frecce dipendenze (option `dependencies`);
  - **drag & drop**: evento `date_change` → dialog conferma ("Spostare 'X' al ...?") → `PATCH /attivita/:id` con nuove date; annullamento → ripristino (re-render);
  - **overlay percorso critico**: attività critiche con classe `critica` (barra rossa, come M2 — CSS via custom class handler);
  - creazione/modifica dipendenze da modulo laterale (riuso `POST /attivita/:id/dipendenze` con errore ciclo mostrato);
- Navigazione: voce "Gantt" in testata ora attiva; selezione progetto via elenco (select).

## 4. Verifica (Gate 3)

- Unit CPM (esaustivi): catena semplice, due rami paralleli (percorsi critici distinti), rombo (convergenza/divergenza), attività isolata, durate 1 giorno, margine calcolato su grafo M2-like.
- Integrazione: API gantt (attività+criticità), persistenza PATCH da drag&drop (via API), dipendenze rifiutate se ciclo.
- CI verde: lint, typecheck, test, build.

## 5. Revision Log

- **2026-09-17** - v1.0.0 - agent/GLM-5.3-Flash - ASD di iniziativa: eredità ASD F02 + dettagli E4 (AD-1/AD-7 declinati). Nessuna deviazione architetturale.
