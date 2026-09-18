# ASD — F11-fix-avanzamento-ore (fix)

flow: {phase: 3-plan, producer: agent/GLM-5.3-Flash (T4), consumer: gate_3 implementation, gate: gate_2_architecture}

## Revision Log
- 1.0.0 - 2026-09-18 - ASD ratificato (agent/GLM-5.3-Flash).

## 1. Decisione
- **AD-28**: `calcolaAvanzamentoProgetto` incorpora `lavorateOre`. Per attività:
  `peso = stimaOre > 0 ? stimaOre : 1`; `contributo = stato === "completata" ? peso :
  (stimaOre > 0 ? clamp(lavorateOre ?? 0, 0, peso) : 0)`. Avanzamento = round(Σcontributo/Σpeso·100),
  null se nessuna attività. Attività senza stima ore: invariato (peso 1, contano solo se completate).
  Coerente con RF-05/06 (avanzamento % su ore stimato/lavorate).

## 2. Piano
- **E11.1** Dominio: formula + test unit (ore parziali pesano, ore > stima clampate, completata = pieno peso, retrocompatibilità).
- **E11.2** Verifica: lint/typecheck/test, smoke Playwright (edit ore → avanzamento dashboard cambia), release notes.

## 3. Accettazione
- Modificare le ore lavorate di un'attività con stima ore → il % della dashboard cambia al refresh
  (e alla chiusura del pannello attività).
