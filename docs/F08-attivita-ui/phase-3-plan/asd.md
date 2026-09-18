# ASD — F08-attivita-ui (Gestione attività in UI)

flow: {phase: 3-plan, producer: agent/GLM-5.3-Flash (T2), consumer: gate_3 implementation, gate: gate_2_architecture}

## Revision Log
- 1.0.0 - 2026-09-18 - ASD ratificato (agent/GLM-5.3-Flash).

## 1. Contesto
API attività complete da F05 (CRUD, dipendenze, KPI, RBAC). Nessun endpoint assignments: l'assegnazione
membri è rimandata a E6 (coerente con PRD §3). Scope F08 = solo client.

## 2. Decisioni architetturali
- **AD-13 (client-only)**: nessuna modifica server/shared tipi (contratti `attivitaCreateSchema`/
  `attivitaPatchSchema` già in `@ws/shared`); solo componenti React + api.ts + i18n + CSS.
- **AD-14 (posizione)**: pannello attività nel Dashboard (E3.4 pattern): pulsante "Attività" per riga
  progetto che apre un pannello `<PannelloAttivita>` sotto forma di sezione modale larga (`.velo-modale`
  riutilizzata) con tabella `.dati`; coerente con M1.
- **AD-15 (azioni)**: per PM/admin — crea (modale con nome, fase, inizio, fine, stato, stimaOre),
  cambia stato (select inline in riga, PATCH parziale), ore lavorate (input inline PATCH), modifica
  completa e rimozione. Membro/osservatore: sola lettura (nasconde azioni; il server impone comunque RBAC).
- **AD-16 (Gantt)**: stato vuoto di SchermataGantt ottiene CTA "Vai ai Progetti" (`navigate("/")`) invece
  del testo fuorviante; testo aggiornato ("crea attività dalla pagina Progetti").

## 3. Piano (storie)
- **E8.1** api.ts: `attivita(idProgetto, filtri?)`, `creaAttivita`, `cambiaStatoAttivita` (PATCH),
  `aggiornaAttivita`, `rimuoviAttivita`; i18n `attivita` (elenco, form, stati già in STATI_TASK).
- **E8.2** `client/src/components/PannelloAttivita.tsx`: elenco + creazione + modifica stato/ore +
  rimozione + modale crea/modifica; integrazione in Dashboard (riga progetto → pulsante).
- **E8.3** Gantt: CTA vuoto → Progetti; testo coerente.
- **E8.4** Verifica: lint/typecheck/build/test, smoke Playwright (login → crea attività → visibile in
  Gantt), release notes.

## 4. Criteri di accettazione
- RF-04..06 operativi da UI: PM crea attività, ne cambia stato, registra ore → avanzamento e KPI
  aggiornati; attività visibili nel Gantt dopo creazione.
- Stati vuoto/azioni allineati ai ruoli (lettura per membro/osservatore).

## 5. Rischi
- Frappe-gantt non rileva nuove attività se non si ricarica: la CTA porta ai Progetti, il ritorno a
  Gantt ricarica (già implementato via useEffect su selezione).
