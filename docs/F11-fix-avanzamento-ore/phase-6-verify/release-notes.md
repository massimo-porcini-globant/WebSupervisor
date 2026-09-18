# Release Notes — F11-fix-avanzamento-ore

flow: {phase: 7-release, producer: agent/GLM-5.3-Flash (E11), consumer: Gate 4 / merge, gate: gate_4_release}

## Bug
Modificando le ore lavorate su una o più attività, la dashboard progetti non aggiornava
lo stato di avanzamento.

## Root cause
`calcolaAvanzamentoProgetto` (dominio AD-6 F05) pesava solo lo stato "completata" per stima ore;
`lavorateOre` non entrava nella formula — il % restava invariato anche dopo refresh.

## Fix (AD-28)
- Per attività con `stimaOre > 0`: contributo = `clamp(lavorateOre, 0, stimaOre)` se non completata,
  pieno peso se completata. Ore negative clampate a 0, ore oltre stima clampate alla stima.
- Attività senza stima ore: comportamento invariato (peso 1, solo stato).
- Route progetti passa ora anche `lavorateOre` al dominio; `derivaStatoProgetto` usa il nuovo
  avanzamento senza modifiche.

## Test
- 97/97 test pass (13 suite): +5 casi unit (ore parziali, clamp oltre stima, clamp negativi,
  completata = pieno peso, retrocompatibilità senza ore).
- Lint 0/0 · Typecheck 0 · Build OK.
- Verifica E2E su stack Docker: "Progetto Demo" avanzamento 0% → 45% dopo PATCH
  `stimaOre:10, lavorateOre:5` su un'attività (5/11 pesati).

## Perimetro
Nessun cambio UI/endpoint/DB. Suggerimento stato progetto (in-linea/a-rischio) eredita il nuovo %.
