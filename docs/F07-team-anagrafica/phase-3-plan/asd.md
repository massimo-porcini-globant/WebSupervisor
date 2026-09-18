# ASD — F07-team-anagrafica (Epica E5: Team & Anagrafica)

flow: {phase: 3-plan, producer: agent/GLM-5.3-Flash (T2), consumer: gate_3 implementation, gate: gate_2_architecture}

## Revision Log
- 1.0.0 - 2026-09-18 - ASD e piano di implementazione ratificati (agent/GLM-5.3-Flash).

## 1. Contesto
PRD v0.1.0 ratificato (Gate 1). Schema attuale: `teams(id, nome UNIQUE)`, `members(id, nome, ruolo,
email, capacitaPunti, teamId→teams.id)`, `projects(teamId)`. Mockup M3 approvato.

## 2. Obiettivo
API e UI per team, membri e assenze (RF-14..16), pronte per l'allocazione E6.

## 3. Decisioni architetturali
- **AD-8 (schema)**: nuova migration drizzle: `members.competenze` (TEXT NULL) e tabella
  `absences(id, memberId → members.id, dal, al, motivo, impattoPercento)`; FK con sintassi
  `REFERENCES tab (col)` (lezione F03). Nessuna modifica a teams/projects.
- **AD-9 (contratti)**: schemi Zod in `shared/src/schemas/team.ts` (AD-5): teamSchema (nome 1..80),
  membroSchema (nome 1..120, ruolo 1..80, email, competenze max 400 opz., capacitaPunti 1..200),
  membroPatch = .partial(), assenzaSchema (dal ≤ al, motivo 1..120, impattoPercento 0..100).
- **AD-10 (API)**: route `server/src/routes/team.ts`:
  - `GET /team` → `{ team: [{id, nome, membri: n, capacita: somma}] }`
  - `POST /team` (ruoliScrittura) → `{ team }`
  - `GET /team/:idTeam/membri` → `{ membri: Membro[] }`
  - `POST /team/:idTeam/membri` (ruoliScrittura) → `{ membro }` (404 team inesistente)
  - `PATCH /membri/:id` (ruoliScrittura) → `{ membro }`
  - `DELETE /membri/:id` (ruoliScrittura) → `{ ok }` (cascata logica: assegnazioni e assenze rimosse)
  - `GET /membri/:id/assenze` → `{ assenze }`
  - `POST /membri/:id/assenze` (ruoliScrittura) → `{ assenza }`
  - `DELETE /assenze/:id` (ruoliScrittura) → `{ ok }`
- **AD-11 (UI)**: `client/src/components/SchermataTeam.tsx` conforme M3: selettore team + "Nuovo
  team", griglia card membri (nome, ruolo, competenze, email, capacità, modifica/rimozione),
  tabella assenze con form inline, stato vuoto M3. api.ts esteso; i18n `team` aggiunto.
- **AD-12 (capacità)**: capacità complessiva = somma capacitaPunti membri (int, %); mostrata nel
  titolo sezione membri ("N membri — capacità complessiva X%").

## 4. Piano (storie)
- **E5.1** Shared: `shared/src/schemas/team.ts` + export in index (AD-9).
- **E5.2** Server: migration (AD-8) + dominio puro `server/src/domain/team.ts`
  (`capacitaComplessiva`, `validaPeriodoAssenza` senza sovrapposizioni per stesso membro) + test.
- **E5.3** Route `server/src/routes/team.ts` (AD-10) con RBAC ruoliScrittura + test integrazione
  (CRUD, 401/400/404, assenza sovrapposta → 400).
- **E5.4** Client: `SchermataTeam.tsx` (M3: griglia, assenze, vuoto, modale membro/assenza, creazione
  team), api.ts, i18n, styles + test component se pattern esistente.
- **E5.5** Verifica: lint/typecheck/build/test 100%, aggiornamento piano, release notes.

## 5. Criteri di accettazione storie (da backlog F02)
- RF-14: PM crea/modifica/rimuove membro con nome, ruolo, competenze, email → visibile in griglia.
- RF-15: PM crea team e assegna team a progetto (projects.teamId via PATCH progetto esistente).
- RF-16: PM registra assenza con periodo/motivo/impatto → elencata in tabella; sovrapposizione
  rifiutata con 400.

## 6. Rischi
- Eliminazione membro con assegnazioni attive: rimozione a cascata delle assegnazioni/assenze
  documentata nella risposta API (campo `assegnazioniRimosse`).
