# Release Notes — F10-export-excel

flow: {phase: 7-release, producer: agent/GLM-5.3-Flash (E10), consumer: Gate 4 / merge, gate: gate_4_release}

## Iniziativa
F10-export-excel (feature, Epica E7 — Export Excel, RF-22/23). Ultima epica dell'MVP ratificato.

## Consegnato
- **E10.1** Dominio puro `server/src/domain/export.ts` (AD-25): `foglioAttivita` (RF-22: progetto, fase,
  inizio/fine, stato, stima/lavorate ore, colonna critica CPM) e `foglioAllocazione` (RF-23: piano con
  assegnazioni/carico + foglio "Sovra-allocazioni"); intestazioni in grassetto, `autoFilter`, colonne
  dimensionate (base gratuita di RF-25). 3 test unit.
- **E10.2** Route `server/src/routes/export.ts` (AD-26): `GET /export/progetti/:id/attivita.xlsx` (401/404/400)
  e `GET /export/allocazione.xlsx?dal&al[&teamId]`; risposta binaria con `content-type` OOXML e
  `content-disposition: attachment`. Riutilizza `costruisceRighe` di allocazione.ts (nessuna duplicazione). 5 test integrazione.
- **E10.3** Client (AD-27): pulsante "Esporta Excel" in PannelloAttivita (per progetto) e in SchermataRisorse
  (intervallo corrente); download diretto `<a download>` con cookie httpOnly; i18n `export.esportaExcel`.

## Test
- 92/92 test pass (13 suite): +3 unit dominio, +5 integrazione export.
- Lint 0/0 · Typecheck 0 · Build OK.
- Smoke E2E Playwright su stack Docker ricostruito: `attivita.xlsx` 200 (6.6 KB, firma ZIP), `allocazione.xlsx`
  200 (7.7 KB, firma ZIP), pulsante presente in /risorse, 0 errori pagina.

## Note / Fix durante lo sviluppo
- exceljs installato in `server/package.json` (hoisting npm workspace corretto).
- Tipi exceljs 4.x incompatibili con `Buffer<ArrayBufferLike>` di @types/node moderni: cast `as never`
  nei test per `wb.xlsx.load`; il dominio usa `writeBuffer` + `Buffer.from` (nessun cast in produzione).
- RF-24 (export KPI) e RF-25 completo: confermati v1.1 come da F02 §2.

## Conformità
- ASD F02 AD-3 (exceljs) e percorsi endpoint ratificati; RF-22, RF-23; RBAC lettura per autenticati.

## MVP
Con F10 l'**MVP ratificato (E1–E7) è completo**: dashboard, progetti, attività, Gantt/CPM, team/assenze,
allocazione risorse, export Excel. Candidature v1.1: RF-16 (MVP critico), RF-24/25, notifiche RF-17, SSO.
