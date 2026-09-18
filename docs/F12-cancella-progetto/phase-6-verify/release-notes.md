# Release Notes — F12-cancella-progetto

flow: {phase: 7-release, producer: agent/GLM-5.3-Flash (E12), consumer: Gate 4 / merge, gate: gate_4_release}

## Iniziativa
F12-cancella-progetto (feature, gap RF-03: CRUD completo progetti — mancava la rimozione).

## Consegnato
- **E12.1** `DELETE /progetti/:id` (AD-29): rimozione **in transazione** con cascata completa
  (assegnazioni → dipendenze in entrambe le direzioni → attività → progetto). RBAC
  amministratore/project_manager; 401/403/404. Fix rilevato durante i test: la transazione
  better-sqlite3 va **invocata** (`transaction(fn)()`), il solo `transaction(fn)` non esegue nulla.
- **E12.2** Client (AD-30): pulsante "Rimuovi" per riga dashboard (solo ruoli di scrittura), conferma
  esplicita con nome progetto, `api.rimuoviProgetto`, refresh elenco; i18n `rimuovi`,
  `confermaRimozione`, `errorePermesso`.
- Extra sessione: `client/nginx.conf` — `Cache-Control: no-cache` su index.html + cache immutabile
  su /assets/ (elimina le recidive di bundle stantio in cache browser).

## Test
- 99/99 test pass (14 suite): +2 integrazione (RBAC 401/403/404; cascata verificata su
  projects/tasks/assignments/task_dependencies).
- Lint 0/0 · Typecheck 0 · Build OK.
- Smoke E2E Playwright su stack Docker: crea progetto via UI → click "Rimuovi" → riga sparita,
  0 errori pagina. Verifica API: DELETE → `{ok:true}`, progetto assente dall'elenco.
