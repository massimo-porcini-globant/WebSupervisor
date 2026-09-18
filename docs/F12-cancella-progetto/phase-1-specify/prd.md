# PRD — F12-cancella-progetto

flow: {phase: 1-specify, producer: agent/GLM-5.3-Flash (T5), consumer: gate_2 architecture, gate: gate_1_specify}

## Revision Log
- 0.1.0 - 2026-09-18 - Prima stesura (agent/GLM-5.3-Flash).

## 1. Richiesta
Nella dashboard manca la funzionalità di cancellazione progetto (gap rispetto a RF-03: CRUD progetti;
l'archiviazione esiste ma non la rimozione esplicita).

## 2. Perimetro
**In scope:**
- `DELETE /progetti/:id` (RBAC amministratore/project_manager): rimozione in transazione di assegnazioni,
  dipendenze e attività del progetto, poi del progetto. 401/403/404. Progetto archiviato: eliminabile.
- Client: pulsante "Rimuovi" per riga dashboard (solo ruoli di scrittura), conferma esplicita,
  refresh elenco; api `rimuoviProgetto`; i18n `progetti.confermaRimozione` + `rimuovi`.

**Fuori scope:** soft-delete aggiuntivo (esiste già l'archiviazione), ripristino di progetti eliminati.

## 3. Accettazione
- [x] Eliminazione con cascata completa e verificata dai test integrazione; dashboard aggiornata dopo rimozione.
