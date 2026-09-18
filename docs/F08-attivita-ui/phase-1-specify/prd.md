# PRD — F08-attivita-ui (Gestione attività in UI)

flow: {phase: 1-specify, producer: agent/GLM-5.3-Flash (T1), consumer: gate_2 architecture, gate: gate_1_specify}

## Revision Log
- 0.1.0 - 2026-09-18 - Prima stesura (agent/GLM-5.3-Flash). Gap emerso in smoke test post-F06/E5.

## 1. Contesto
Le API attività (F05) sono complete, ma **nessuna schermata consente di creare/modificare attività**:
il vuoto del Gantt rimanda a una sezione "Progetti" che non offre tale funzionalità. Il flusso
Gantt (RF-08/09) risulta inutilizzabile senza call API esterne. Con F07 completata, il gap blocca
la dimostrazione end-to-end MVP.

## 2. Obiettivo
Consentire a PM/admin di gestire le attività di un progetto dall'interfaccia, completando il flusso
Progetti → Attività → Gantt.

## 3. Perimetro
**In scope:**
- Pannello attività per progetto (elenco con stato/fase/date/ore, avanzamento).
- Creazione attività (nome, fase, inizio, fine, stato, stimaOre) — RBAC PM/admin.
- Modifica rapida: cambio stato (RF-06) e ore lavorate; modifica completa via modale.
- Rimozione attività (PM/admin).
- Pulsante "Nuova attività" nello stato vuoto del Gantt (collega F06 al nuovo pannello).
- Assegnazione membro: **fuori scope** — non esiste alcun endpoint assignments (solo seed/test);
  rimanda a E6 allocazione risorse (RF-18..21).

**Fuori scope:** notifiche (RF-17), allocazione/carico (E6), export (E7), modifica dipendenze
(già in SchermataGantt).

## 4. Interfaccia
- Dashboard: riga progetto espandibile (o pulsante) → pannello attività del progetto, conforme
  ai pattern M1 (tabella `.dati`, badge stato, pulsanti `.pulsante`).
- Il Gantt resta la vista temporale; il pannello è la vista operativa CRUD.

## 5. Vincoli
- Nessuna modifica API server necessaria (F05 copre tutto; assegnazioni via POST/DELETE assignments
  se endpoint esistente, altrimenti assegnazione differita — verificare a Gate 2).
- RBAC lato server già implementato e testato (F05); UI nasconde azioni per ruoli non autorizzati.

## 6. Criteri di Accettazione (Gate 1)
- [x] Gap individuato: creazione attività solo via API; messaggio vuoto Gantt incoerente.
- [x] Perimetro: pannello attività (CRUD + stato + ore) in UI; nessuna modifica server attesa.
