# ASD — F12-cancella-progetto

flow: {phase: 3-plan, producer: agent/GLM-5.3-Flash (T5), consumer: gate_3 implementation, gate: gate_2_architecture}

## Revision Log
- 1.0.0 - 2026-09-18 - ASD ratificato (agent/GLM-5.3-Flash).

## Decisioni
- **AD-29**: `DELETE /progetti/:id` esegue in **transazione** (better-sqlite3): delete assignments (via
  task ids del progetto), delete task_dependencies (via task ids, entrambe le direzioni), delete tasks,
  delete project. Il vincolo FK assignments→tasks richiede l'ordine sopra. 404 progetto inesistente;
  RBAC come creazione (amministratore/project_manager).
- **AD-30**: client — pulsante "Rimuovi" accanto ad "Attività" per riga, `window.confirm` con nome
  progetto (pattern già usato per attività/membri), `api.rimuoviProgetto`, refresh `carica()`.
  Membro/osservatore non vedono il pulsante (il server comunque rifiuta).

## Piano
- **E12.1** Route DELETE + test integrazione (cascata, 401/403/404, progetto con/dipendenze e assegnazioni).
- **E12.2** Client: pulsante + i18n + api.
- **E12.3** Verifica: lint/typecheck/test, smoke Playwright (crea progetto → rimuovi → sparito), release notes.
