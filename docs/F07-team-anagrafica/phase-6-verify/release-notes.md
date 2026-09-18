# Release Notes — F07-team-anagrafica

flow: {phase: 7-release, producer: agent/GLM-5.3-Flash (E5), consumer: Gate 4 / merge, gate: gate_4_release}

## Iniziativa
F07-team-anagrafica (feature, Epica E5 — Team & Anagrafica, RF-14..16).

## Consegnato
- **E5.1 — Contratti shared** (`shared/src/schemas/team.ts`, AD-9): teamCreateSchema, membroCreateSchema, membroPatchSchema (.partial()), assenzaCreateSchema (dal ≤ al, motivo 1..120, impattoPercento 0..100); tipi Team, TeamConMembri, Membro, Assenza.
- **E5.2 — Schema + dominio** (AD-8): migration `0001_team_assenze` (members.competenze TEXT; member_absences.impatto_percento INT DEFAULT 100; indice member_idx) + dominio puro `server/src/domain/team.ts` (`capacitaComplessiva`, `assenzaSovrapposta`) con 7 test unit. Nota: SQLite non supporta ALTER COLUMN → `motivo` resta nullable a livello DB, obbligatorio via Zod.
- **E5.3 — API** (`server/src/routes/team.ts`, AD-10): `GET/POST /team`, `GET/POST /team/:id/membri`, `PATCH/DELETE /membri/:id` (rimozione a cascata assegnazioni+assenze, risposta con `assegnazioniRimosse`), `GET/POST /membri/:id/assenze` (anti-sovrapposizione → 400), `DELETE /assenze/:id`; RBAC ruoliScrittura; 401/400/404/409. 7 test integrazione.
- **E5.4 — UI** (`client/src/components/SchermataTeam.tsx`, M3): selettore team + nuovo team, griglia card membri (avatar iniziali colorate, ruolo, email, tag competenze, barra capacità, modifica/rimozione con conferma), titolo con "N membri — capacità complessiva X%", tabella assenze (Membro/Periodo/Motivo/Impatto) con aggiunta/rimozione, stati vuoti M3 (no team / nessun membro), modali membro/assenza. Navigazione `/team` attiva in App; i18n `team` esteso; CSS griglia/avatar/tag.

## Test
- 71/71 test pass (10 suite): +7 unit dominio team, +7 integrazione API team.
- Lint: 0 errori/warning · Typecheck: 0 diagnostici · Build client: OK.

## Note
- Lezione: le migration drizzle richiedono `--> statement-breakpoint` tra statement (better-sqlite3 non accetta statement multipli).
- Capacità mostrata come valore del membro (capacitaPunti %); l'impiego (carico) arriva con E6 allocazione.
- Notifiche assegnazione RF-17: fuori scope come da PRD.

## Conformità
- Mockup M3 (F01, RF-28..30); RF-14, RF-15, RF-16.
