# ASD — F09-allocazione-risorse (Epica E6: Allocazione risorse)

flow: {phase: 3-plan, producer: agent/GLM-5.3-Flash (T2), consumer: gate_3 implementation, gate: gate_2_architecture}

## Revision Log
- 1.0.0 - 2026-09-18 - ASD e piano ratificati (agent/GLM-5.3-Flash).

## 1. Contesto
PRD Gate 1. `assignments(taskId, memberId, percento, dal, al)` esiste nello schema ma senza API/UI.
Debito F05: RBAC membro-assegnato usa `members.nome === users.username`.

## 2. Decisioni architetturali
- **AD-17 (schema)**: migration `0002_allocazione`: `members.user_id` (INTEGER NULL REFERENCES users (id))
  + indice; la corrispondenza utente↔membro diventa esplicita (impostabile da UI Team, default via
  username=nome quando assente per retrocompatibilità del RBAC esistente).
- **AD-18 (contratti shared)** `shared/src/schemas/allocazione.ts`: assegnazioneCreateSchema
  (memberId int+, percento 1..100, dal/al ISO, dal ≤ al); tipi `Assegnazione`, `RigaPiano`
  (membro, assegnazioni[], carico per settimana), `CaricoSettimana` (settimana, impegno %, sovraallocata).
- **AD-19 (dominio puro)** `server/src/domain/allocazione.ts`: `settimaneIntervallo(dal, al)` → settimane
  ISO [anno, numero, inizio, fine]; `caricoSettimanale(assegnazioni, capacitaPunti, settimane)` → somma
  `percento` delle assegnazioni che intersecano la settimana ÷ capacità × 100; `sovraallocata` ⟺ impegno > 100
  (o > capacità dichiarata se < 100 — capacity normalizzata). Assenze non impattate (PRD §5).
- **AD-20 (API)** `server/src/routes/allocazione.ts`:
  - `GET /progetti/:idProgetto/allocazione` → `{ righe: RigaPiano[], avvisi: Avviso[] }` (RF-19/20,
    per il progetto con membri del team assegnato o con assegnazioni attive)
  - `GET /allocazione/carico?dal=&al=&teamId=` → `{ righe: RigaPiano[], avvisi }` (RF-21, trasversale)
  - `POST /attivita/:id/assegnazioni` (ruoliScrittura) → `{ assegnazione }` (RF-18; 404 membro/attività,
    400 validazione; membro deve appartenere al team del progetto o essere libero)
  - `DELETE /assegnazioni/:id` (ruoliScrittura) → `{ ok }`
  - `PATCH /membri/:id/collega-utente` (ruoliScrittura) → `{ membro }` (AD-17, collega user_id)
- **AD-21 (RBAC fix)**: `membroAssegnato` in routes/attivita.ts usa `members.user_id === userId`
  (fallback `nome === username` se user_id NULL, per dati legacy).
- **AD-22 (UI)** `client/src/components/SchermataRisorse.tsx` conforme M-allocation: intervallo
  (4 settimane da oggi, navigabile ±), avvisi sovra (`.avviso in-ritardo`), tabella piano
  (membro → tag assegnazioni con attività/progetto → colonne settimana % con riga `.riga-sovra`),
  carico per persona, stato vuoto, modale assegnazione (membro/attività/percento/periodo) accessibile
  dal pannello attività (sezione "Assegnazioni") e dal vuoto Risorse. Navigazione `/risorse` attiva in App.
- **AD-23 (flusso)**: dal PannelloAttivita ogni attività mostra le assegnazioni esistenti + form rapido
  "Assegna membro" (usa POST assegnazioni). Risorse resta la vista di piano/carico.

## 3. Piano (storie)
- **E9.1** Shared: schema + tipi (AD-18), export index.
- **E9.2** Server: migration 0002 (AD-17) + seed collega utenti↔membri esistenti + RBAC fix (AD-21) + test.
- **E9.3** Dominio allocazione (AD-19) + test unit (intersezioni parziali, sovra, settimana singola/globale).
- **E9.4** Route allocazione (AD-20) + test integrazione (RBAC, 400/404, piano, carico, avvisi sovra).
- **E9.5** UI SchermataRisorse (AD-22/23) + i18n `risorse` + CSS griglia-allocazione/riga-sovra; api.ts.
- **E9.6** Verifica: lint/typecheck/build/test, smoke Playwright (assegna → piano → sovra → carico), release notes.

## 4. Criteri di accettazione
- RF-18: PM assegna membro a attività con % e periodo → visibile in pannello e piano.
- RF-19: piano "chi lavora su cosa e quando" su intervallo.
- RF-20: avviso + riga evidenziata quando impegno settimanale > capacità.
- RF-21: carico per persona su intervallo con % settimanali.
- RBAC membro-assegnato funzionante via FK (test dedicato).

## 5. Rischi
- Calcoli settimana ISO (lu–dom) vs assegnazioni che finiscono domenica: intersezione inclusiva testata in unit.
- Dati legacy senza user_id: fallback F05 mantenuto finché non collegati.
