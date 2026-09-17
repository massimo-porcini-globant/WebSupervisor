<!--
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash, consumer: release clearance (Gate 4), gate: gate_4_release}
-->

# Release Notes — F05-activities-progress

## Versione
0.3.0-activities (E3.1–E3.4)

## Consegnato
- **E3.1 — CRUD attività + dipendenze**: API `/progetti/:id/attivita` (elenco con dipendenze, crea) e `/attivita/:id` (PATCH, DELETE con pulizia dipendenze), `POST/DELETE /attivita/:id/dipendenze`; anti-ciclo DFS nel dominio (`rilevaCiclo`), auto-dipendenza e cross-progetto rifiutate (400).
- **E3.2 — RBAC membro assegnato**: membro con assegnazione sull'attività può aggiornare solo `stato` e `lavorateOre` (schema Zod dedicato); altri campi → 403; membro non assegnato e osservatore → 403.
- **E3.3 — KPI riepilogo**: `GET /progetti/:id/kpi` (completate/in corso/da iniziare/in ritardo + scadenze entro 10 giorni); `GET /progetti` arricchito con `avanzamento` (% pesata AD-6) e `suggerimentoStato` (derivazione dominio).
- **E3.4 — UI (M1)**: colonna "Avanzamento" con barra in tabella progetti; sezione "Scadenze imminenti" con avvisi colorati (in-ritardo/a-rischio) aggregate su tutti i progetti; i18n esteso.

## Verifica
- lint 0/0 · typecheck 0 · build OK
- test: 45/45 (auth 9, RBAC 4, avanzamento 11, attivita dominio 8, progetti 9, attività integrazione 7... suddivisi su 6 file)
- Smoke E2E: attività 201, KPI con scadenze imminenti corrette (data fix), avanzamento 0% + suggerimento a-rischio su progetto con attività in ritardo vs curva attesa

## Note operative
- Mappatura MVP membro↔persona: `assignments.member_id` → `members.nome` confrontato con `users.username` (documentato in ASD F05 §5; sostituito da FK dedicata in E6).
- Le scadenze considerano solo attività non completate con `fine <= oggi+10`.

## Deviazioni dal piano
- Nessuna deviazione architetturale.
