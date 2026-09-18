# PRD — F11-fix-avanzamento-ore (fix)

flow: {phase: 1-specify, producer: agent/GLM-5.3-Flash (T3), consumer: gate_2 architecture, gate: gate_1_specify}

## Revision Log
- 0.1.0 - 2026-09-18 - Prima stesura (agent/GLM-5.3-Flash).

## 1. Bug report
Modificando le ore lavorate su una o più attività, la dashboard progetti non aggiorna
lo stato di avanzamento.

## 2. Root cause
`calcolaAvanzamentoProgetto` (server/src/domain/avanzamento.ts) pesa ogni attività solo per
`stimaOre` e la considera avanzata **solo se stato = "completata"**. Il campo `lavorateOre`
non entra nella formula: il % resta invariato qualunque cosa si scriva in "ore lavorate",
anche dopo refresh (il client ricarica correttamente; il valore restituito non cambia).

## 3. Perimetro
**In scope:**
- Formula avanzamento che incorpora `lavorateOre`: per attività con `stimaOre > 0`, il contributo
  è `clamp(lavorateOre, 0, stimaOre)` quando non completata, pieno peso se completata;
  attività senza stima ore conservano il comportamento attuale (peso 1, solo stato).
- Test unit dominio aggiornati/aggiunti (caso ore parziali, ore oltre stima, completata).
- Il suggerimento stato (`derivaStatoProgetto`) usa il nuovo avanzamento senza modifiche.

**Out of scope:** UI dashboard (nessun cambio: il refresh già avviene), campo stima/lavorate,
endpoint, DB.

## 4. Criteri di Accettazione (Gate 1)
- [x] Root cause individuata nella formula di dominio (AD-6 F05), non nel client.
- [x] Formula proposta retrocompatibile con i casi senza ore lavorate.
