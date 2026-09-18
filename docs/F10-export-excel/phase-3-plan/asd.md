# ASD — F10-export-excel (Epica E7: Export Excel RF-22/23)

flow: {phase: 3-plan, producer: agent/GLM-5.3-Flash (T2), consumer: gate_3 implementation, gate: gate_2_architecture}

## Revision Log
- 1.0.0 - 2026-09-18 - ASD ratificato (agent/GLM-5.3-Flash).

## 1. Decisioni architetturali
- **AD-24 (libreria)**: exceljs (AD-3 F02). Dipendenza in `server/package.json`; nessun componente nativo.
- **AD-25 (dominio puro)**: `server/src/domain/export.ts` — funzioni pure che popolano un `ExcelJS.Workbook`
  da dati grezzi: `foglioAttivita(wb, { progetto, attivita })` (RF-22) e `foglioAllocazione(wb, { intervallo, righe, avvisi })`
  (RF-23). Intestazioni in grassetto, `worksheet.autoFilter`, colonne dimensionate. Testabili senza HTTP.
- **AD-26 (route)** `server/src/routes/export.ts`:
  - `GET /export/progetti/:idProgetto/attivita.xlsx` (RF-22) → 404 progetto inesistente
  - `GET /export/allocazione.xlsx?dal=&al=&teamId=` (RF-23, stessi parametri di `/allocazione/carico`)
  - Autenticazione richiesta (cookie); risposta binaria con `content-disposition: attachment; filename=…`.
  - Riutilizza le query di allocazione (piano/carico) e le attività del progetto.
- **AD-27 (client)**: pulsanti download con `<a href="/api/v1/export/…" download>` (il cookie httpOnly
  accompagna la navigazione): "Esporta Excel" in PannelloAttivita (per progetto) e in SchermataRisorse
  (intervallo corrente + team, come da mockup M-allocation). i18n `esportaExcel`.

## 2. Piano (storie)
- **E10.1** Server: exceljs + dominio export (AD-25) + test unit (righe/fogli/formati).
- **E10.2** Route export (AD-26) + test integrazione (200, content-type, buffer leggibile, 401, 404, 400).
- **E10.3** Client: pulsanti export + i18n (AD-27); nessun cambio api.ts (download diretto).
- **E10.4** Verifica: lint/typecheck/build/test, smoke Playwright (download attivita.xlsx e allocazione.xlsx
  con verifica dimensione/magia ZIP `PK`), release notes.

## 3. Criteri di accettazione
- RF-22: download .xlsx attività con colonne stato/date; 401 senza sessione; 404 progetto inesistente.
- RF-23: download .xlsx piano allocazione con carico settimanale e avvisi sovra.

## 4. Rischi
- exceljs in bundle server ESM/CJS: si usa `import ExcelJS from "exceljs"` (default interop testato).
