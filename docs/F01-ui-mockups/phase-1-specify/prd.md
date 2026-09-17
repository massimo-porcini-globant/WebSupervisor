---
version: 0.1.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 1
  producer: agent/GLM-5.3-Flash
  consumer: phase-3-plan (ASD)
  gate: gate_1_specify
---

# PRD — F01-ui-mockups: Mockup ad Alta Fedeltà delle Schermate Principali

> **Fonte**: `input/context/requisiti-web-project-manager-v1.0.md` (Documento dei Requisiti v1.0, §3.8, §5)
> **Requisiti coperti**: RF-28 (Alta), RF-29 (Media), RF-30 (Media)
> **Architettura di riferimento**: API-first + SPA (backend Fastify headless, client React disaccoppiato)

## 1. Contesto e Problema

WebSupervisor è una webapp per la gestione dei progetti (dashboard avanzamento, Gantt, team, allocazione risorse, export Excel). Il requisito RF-28 vincola lo **sviluppo** alla validazione preventiva dei mockup ad alta fedeltà delle schermate principali, per congelare l'esperienza utente prima dell'implementazione funzionale e ridurre rework costoso in fase di sviluppo.

## 2. Obiettivo e Success Criteria

Produrre 4 mockup ad alta fedeltà (HTML/CSS statici o immagini), validati dagli stakeholder, che rappresentino l'interfaccia target dell'MVP.

**Done quando**:
1. Tutti i 4 mockup coprono gli stati principali richiesti da RF-29 (vuoto, popolato, in ritardo/a rischio, sovra-allocazione dove applicabile).
2. I flussi chiave delle user story (§5 dei requisiti) sono riprodotti navigando i mockup.
3. Gli stakeholder hanno approvato o fornito feedback (RF-30) e i mockup sono stati aggiornati di conseguenza.

## 3. Deliverable

| # | Schermata | Requisiti UI riflessi | Stati da mostrare |
|---|---|---|---|
| M1 | **Dashboard Progetti** | RF-03, RF-04, RF-05, RF-06, RF-07 | vuota, popolata, progetto a rischio/in ritardo, scadenze imminenti |
| M2 | **Diagramma di Gantt** | RF-08, RF-09, RF-10, RF-11, RF-12, RF-13 | vuoto, popolato con dipendenze, critical path, drag & drop (rappresentazione), zoom temporale |
| M3 | **Gestione Team** | RF-14, RF-15, RF-16, RF-17 | vuota, anagrafica membri, disponibilità %, ferie/assenze |
| M4 | **Allocazione Risorse** | RF-18, RF-19, RF-20, RF-21 | piano allocazione, sovra-allocazione evidenziata, carico di lavoro persona/team |

Ogni mockup deve essere in **italiano** (RNF-08) e visualizzabile su desktop (RNF-03); layout consultabile su tablet (RNF-04).

## 4. Out of Scope

- Implementazione funzionale (API, persistenza, logica di calcolo avanzamento)
- Autenticazione/login (mockup del login non richiesto in MVP, RF-26 coperto da iniziativa dedicata)
- Export Excel (RF-22..RF-25: separata iniziativa)
- App mobile nativa (out of scope v1.0)

## 5. User Story di Riferimento

1. Come project manager, voglio vedere una dashboard con l'avanzamento di tutti i miei progetti → **M1**
2. Come project manager, voglio pianificare le attività su un Gantt → **M2**
3. Come project manager, voglio aggiungere membri al team e assegnarli → **M3**
4. Come project manager, voglio vedere se qualcuno è sovra-allocato → **M4**
5. Come membro del team, voglio vedere le attività a me assegnate → rappresentabile in M1/M4 (vista "mie attività" opzionale nel mockup)
6. Come management, voglio esportare i dati in Excel → pulsanti di esportazione rappresentati in M1/M2/M4

## 6. Vincoli

- Mockup realizzati con la skill autorizzata `frontend-design` (Anthropic), come richiesto da RF-28.
- Interfaccia in italiano; predisposizione all'internazionalizzazione (RNF-08).
- Usabilità senza formazione per PM non tecnico (RNF-01) — gerarchie visive semplici, etichette chiare.
- Gli stati degli indicatori seguono il modello: `in linea` (verde), `a rischio` (ambra), `in ritardo` (rosso).
- Artefatti mockup archiviati sotto `docs/F01-ui-mockups/phase-1-specify/mockups/` come input validabile.

## 7. Criteri di Accettazione (Gate 1)

- [ ] PRD ratificato e privo di `[TBD]` non sistematici
- [ ] Ambito dei 4 mockup confermato dallo stakeholder (sezione 3)
- [ ] Mappatura esplicita requisito → mockup → stato UI (tabella sopra)

## 8. Revision Log

- **2026-09-17** - v0.1.0 - agent/GLM-5.3-Flash - Bozza iniziale PRD da documento requisiti v1.0.
