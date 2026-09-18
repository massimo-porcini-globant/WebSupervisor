# Release Notes — F09-allocazione-risorse

flow: {phase: 7-release, producer: agent/GLM-5.3-Flash (E9), consumer: Gate 4 / merge, gate: gate_4_release}

## Iniziativa
F09-allocazione-risorse (feature, Epica E6 — Allocazione risorse, RF-18..21).

## Consegnato
- **E9.1** Contratti shared (`schemas/allocazione.ts`): assegnazioneCreateSchema, collegaUtenteSchema; tipi Assegnazione, RigaPiano, CaricoSettimana, AvvisoSovra (AD-18).
- **E9.2** Migration `0002_allocazione`: `members.user_id → users.id` + indice (AD-17); **RBAC fix (AD-21)**: `membroAssegnato` usa la FK (fallback legacy nome↔username per dati non collegati); seed esteso con team/membro/progetto/attività demo collegati (FK user_id=3). Debito F05 ASD §5 chiuso.
- **E9.3** Dominio puro `allocazione.ts` (AD-19): `settimaneIntervallo` (ISO lun–dom, troncamento finale), `caricoSettimanale` (somma % intersezioni ÷ capacità), `avvisiSovra`. 8 test unit. Fix: campo `settimana.settimana` in avvisi.
- **E9.4** API (AD-20): `POST /attivita/:id/assegnazioni`, `DELETE /assegnazioni/:id`, `PATCH /membri/:id/collega-utente`, `GET /progetti/:id/allocazione` (RF-19/20), `GET /allocazione/carico?dal&al&teamId` (RF-21); RBAC ruoliScrittura; 400/401/403/404. 5 test integrazione (incluso test RBAC via FK: 403 → collega-utente → 200).
- **E9.5** UI `SchermataRisorse.tsx` conforme M-allocation (AD-22): intervallo 4 settimane navigabile ±, avvisi sovra (`.avviso.in-ritardo`), piano "chi lavora su cosa e quando" (tag assegnazioni + % settimanali, righe `.riga-sovra`), carico per persona, stato vuoto, modale assegnazione; navigazione `/risorse` attiva; i18n `risorse`; CSS griglia/celle sovra.

## Test
- 84/84 test pass (12 suite): +8 unit dominio, +5 integrazione API.
- Lint 0/0 · Typecheck 0 (inclusa correzione tipi preesistente in gantt.test.ts) · Build OK.
- Smoke E2E Playwright su http://localhost:8080 (stack Docker ricostruito): login → /risorse → avviso sovra-allocazione (150%/80%), 2 tabelle piano/carico, celle evidenziate, 0 errori pagina.

## Note / Fix durante lo sviluppo
- Seed: bug di destrutturazione (`const [x] = returning()` su insert multipli) impediva le assegnazioni demo — corretto e reso idempotente.
- Lezione: `const [x] = query.returning()` su insert di N righe restituisce solo la prima.
- Impatto assenze sul carico e riequilibrio automatico: fuori scope (PRD §3); export Excel → E7 (RF-23).

## Conformità
- Mockup M-allocation (F01, RF-28..30); RF-18, RF-19, RF-20, RF-21.
