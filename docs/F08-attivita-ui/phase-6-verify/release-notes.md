# Release Notes — F08-attivita-ui

flow: {phase: 7-release, producer: agent/GLM-5.3-Flash (E8), consumer: Gate 4 / merge, gate: gate_4_release}

## Iniziativa
F08-attivita-ui (feature, gap-fix post smoke test F06/E5).

## Consegnato
- **E8.1** api.ts: `attivita`, `creaAttivita`, `aggiornaAttivitaEsistente`, `rimuoviAttivita`; i18n `attivita` (elenco, form, stati).
- **E8.2** `PannelloAttivita.tsx`: pannello per progetto con elenco (nome/fase/date/stato/ore), creazione e modifica completa via modale, cambio stato inline, ore lavorate inline, rimozione con conferma; RBAC UI (azioni solo PM/admin); pulsante "Attività" su ogni riga della Dashboard.
- **E8.3** Stato vuoto del Gantt: CTA "Vai ai Progetti" + testo corretto (sostituisce il riferimento a una sezione inesistente).

## Test
- 71/71 test pass (nessuna modifica server; suite invariate e verdi).
- Lint 0/0 · Typecheck 0 · Build OK.
- Smoke E2E Playwright (headless Edge) su http://localhost:8080 (stack Docker ricostruito): login → pannello attività → creazione attività → cambio stato inline → ore lavorate → chiusura → Gantt mostra le barre delle attività; 0 errori pagina.

## Note
- Assegnazione membri alle attività: rimandata a E6 (non esiste endpoint assignments; coerente PRD).
- Lo stack Docker è stato ricostruito (`docker compose up -d --build`) come parte della verifica.

## Conformità
- Completa il flusso operativo Progetti → Attività → Gantt (RF-04..06, RF-08/09).
