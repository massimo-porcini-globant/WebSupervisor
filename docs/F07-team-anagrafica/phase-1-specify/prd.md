# PRD — F07-team-anagrafica (Epica E5: Team & Anagrafica)

flow: {phase: 1-specify, producer: agent/GLM-5.3-Flash (T1), consumer: gate_2 architecture, gate: gate_1_specify}

## Revision Log
- 0.1.0 - 2026-09-18 - Prima stesura (agent/GLM-5.3-Flash).

## 1. Contesto
F06 (Gantt + CPM) è merged in main. L'MVP richiede ora la gestione dei team e l'anagrafica dei membri
(Epica E5 del backlog F02), conforme al mockup M3 (`docs/F01-ui-mockups/phase-1-specify/mockups/team.html`).
Lo schema DB ha già `teams` (id, nome) e `members` (id, nome, ruolo, email, capacitaPunti, teamId);
manca la gestione assenze/indisponibilità (RF-16) e le competenze (RF-14).

## 2. Obiettivo
Consentire a PM/admin di gestire team, membri e disponibilità (RF-14..16), così da alimentare
l'allocazione risorse (E6) e il carico di lavoro.

## 3. Perimetro
**Requisiti in scope (da backlog F02):**
- RF-14 (Alta): CRUD membri del team (nome, ruolo, competenze, email).
- RF-15 (Alta): CRUD team, associabili ai progetti (projects.teamId già esistente).
- RF-16 (Media): anagrafica con disponibilità: capacità (capacitaPunti, %) e assenze programmate
  (periodo dal–al, motivo, impatto %).

**Fuori scope:** notifiche assegnazione (RF-17, Bassa — candidato MVP-lite/v1.1); allocazione e
carico di lavoro (E6); modifica relazioni assignments.

## 4. Interfaccia (contratto M3)
- Selettore team + creazione team; titolo con conteggio membri e capacità complessiva sommata.
- Griglia card membri: nome, ruolo, competenze, email, capacità %, azioni modifica/rimozione.
- Stato vuoto conforme M3 ("Nessun membro nel team" + CTA).
- Sezione "Assenze programmate" (RF-16): tabella Membro / Periodo / Motivo / Impatto, con aggiunta.
- Navigazione `/team` già presente in App.

## 5. Vincoli
- Stack vincolato: Fastify + drizzle + better-sqlite3; React/Vite; Zod shared (AD-5).
- RBAC: scrittura riservata ad amministratore/project_manager (ruoliScrittura); lettura a tutti gli
  utenti autenticati, coerente con le schermate esistenti.
- SQLite: migration drizzle aggiuntiva per assenze + competenze; FK `REFERENCES` sintassi già
  validata in F03.
- Layout M3 senza navigazione progetto: la schermata è organizzata per team (selettore).

## 6. Criteri di Accettazione (Gate 1)
- [x] Perimetro chiuso: RF-14, RF-15, RF-16 in scope; RF-17 fuori.
- [x] Contratto UI M3 identificato (mockup approvato F01, RF-28..30).
- [x] Estensione schema individuata (membri.competenze, tabella assenze).
