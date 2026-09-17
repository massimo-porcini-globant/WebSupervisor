---
version: 0.1.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 1
  producer: agent/GLM-5.3-Flash
  consumer: phase-3-plan (ASD 12 sezioni + backlog MVP)
  gate: gate_1_specify
---

# PRD — F02-mvp-asd-backlog: Architettura completa dell'app e Backlog MVP

> **Fonti**: `input/context/requisiti-web-project-manager-v1.0.md` (requisiti v1.0) · `docs/F01-ui-mockups/phase-6-verify/release-notes.md` (requisiti UI congelati, GO) · `CONSTITUTION.md` §3 (stack ratificato)
> **Architettura confermata**: API-first + SPA — backend Fastify (headless, API REST JSON) + client React/Vite disaccoppiato + SQLite

## 1. Contesto

I mockup F01 sono stati approvati e i requisiti UI congelati (RF-28..30 chiusi). Questa iniziativa definisce l'**architettura completa dell'applicazione** (ASD full 12 sezioni, via `g-e-asd-create`) e **decompone l'MVP in epiche e storie** con priorità e stima di massima, come da "Prossimi passi" §7 del documento dei requisiti (punti 4).

## 2. Obiettivo

1. ASD completo e ratificato dell'app WebSupervisor (monolite modulare, API-first + SPA) che copra tutte le sezioni rilevanti: contesto, funzionale, NFR, vincoli, principi, architettura software, infrastruttura, dati, DevOps, testing.
2. Backlog MVP strutturato (epiche → storie con criteri di accettazione) e roadmap di massima per la prima release.

**Done quando**: ASD ratificato senza `[TO BE DEFINED]` bloccanti + backlog MVP approvato dall'operatore + roadmap di stima presentata.

## 3. Proposta di perimetro MVP (da ratificare)

**In MVP** (priorità Alta + convergenza coi mockup approvati):
- Autenticazione e ruoli (RF-26, RF-27 — password locale; SSO differito)
- Gestione progetti: creazione, modifica, archiviazione, elenco filtrabile (RF-01..03)
- Dashboard avanzamento con KPI e indicatori di stato (RF-04..07)
- Gantt: vista attività, dipendenze, drag & drop date, fasi/milestone, zoom (RF-08..10, RF-12, RF-13); critical path (RF-11)
- Gestione team e anagrafica disponibilità (RF-14..16); notifiche assegnazione (RF-17, Bassa — valutare in MVP-lite)
- Allocazione risorse, piano, sovra-allocazione, carico di lavoro (RF-18..21)
- Export Excel attività + allocazione (RF-22, RF-23; RF-24/25 Media/Bassa — valutare)

**Fuori MVP**: SSO (RF-26 parziale), notifiche (RF-17), export KPI avanzato (RF-24/25) — candidati a v1.1.

## 4. Fuori Ambito

Come da documento requisiti §6 (time tracking esterni, fatturazione, app mobile nativa, gestione documentale avanzata).

## 5. Vincoli

- Stack vincolato dalla Costituzione §3.1: TypeScript/Node 20, React 18+Vite, Fastify, SQLite, Vitest, npm workspaces.
- Mockup F01 approvati = contratto UI di riferimento (colori/layout/sezione dashboard, Gantt, team, allocazione).
- RNF-02: dashboard/Gantt ≤ 2-3 s con 500 attività (vincolo progettuale sull'SQLite e sul rendering).
- Localizzazione italiana; struttura i18n predisposta (RNF-08).

## 6. Criteri di Accettazione (Gate 1)

- [ ] PRD ratificato; perimetro MVP confermato dall'operatore (sezione 3)
- [ ] Ambiguità chiave registrate: scelta Gantt lib (AD del F02-ASD), meccanismo auth, lib export, ORM — risolte a Gate 2
- [ ] User story complete di criteri di accettazione per le epiche MVP

## 7. Revision Log

- **2026-09-17** - v0.1.0 - agent/GLM-5.3-Flash - Bozza PRD con proposta perimetro MVP.
