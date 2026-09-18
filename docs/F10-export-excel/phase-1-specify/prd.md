# PRD — F10-export-excel (Epica E7: Export Excel, RF-22/23)

flow: {phase: 1-specify, producer: agent/GLM-5.3-Flash (T1), consumer: gate_2 architecture, gate: gate_1_specify}

## Revision Log
- 0.1.0 - 2026-09-18 - Prima stesura (agent/GLM-5.3-Flash). Ultima epica dell'MVP ratificato.

## 1. Contesto
E1–E6 completate (Progetti, Attività, Gantt/CPM, Team, Allocazione). L'MVP richiede l'export Excel
delle attività (RF-22, Alta) e del piano di allocazione (RF-23, Alta). L'ASD F02 (AD-3) ratifica
**exceljs** e gli endpoint `GET /api/export/tasks.xlsx` / `/allocation.xlsx`. Il pulsante "Esporta
Excel" è già previsto nel mockup M-allocation (RF-23).

## 2. Obiettivo
Consentire il download .xlsx dell'elenco attività di un progetto (stati e date, RF-22) e del piano
di allocazione/carico su intervallo (RF-23), per utenti autenticati.

## 3. Perimetro
**In scope:**
- Export .xlsx attività di un progetto: nome, fase, inizio, fine, stato, stima/lavorate ore (RF-22).
- Export .xlsx allocazione: piano/carico per membro e settimana con impegno % e sovra (RF-23).
- Formattazione base: intestazioni in grassetto + filtri automatici (anticipa RF-25 a costo zero
  con exceljs; RF-24/25 restano formalmente v1.1 come da F02 §2).
- Pulsanti export in UI: PannelloAttivita (per progetto) e SchermataRisorse (allocazione corrente).

**Fuori scope:** export KPI avanzato (RF-24, v1.1), personalizzazioni layout (RF-25 completo, v1.1).

## 4. Vincoli
- exceljs come da AD-3 (MIT, formattazione celle, streaming).
- Download autenticato via cookie di sessione (httpOnly); risposte `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- RBAC: lettura per tutti gli utenti autenticati (nessuna scrittura).
- Docker: nessuna dipendenza nativa (exceljs è JS puro).

## 5. Criteri di Accettazione (Gate 1)
- [x] Perimetro chiuso: RF-22/23 in scope; RF-24/25 v1.1.
- [x] Libreria e percorsi endpoint già ratificati in F02 (AD-3).
