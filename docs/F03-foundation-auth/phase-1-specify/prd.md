---
version: 0.1.0
date: 2026-09-17
author: agent/GLM-5.3-Flash
flow:
  phase: 1
  producer: agent/GLM-5.3-Flash
  consumer: phase-3-plan (ASD/plan di E1) → phase-5-implement
  gate: gate_1_specify
---

# PRD — F03-foundation-auth: Fondamenta & Autenticazione (Epica E1)

> **Fonti**: backlog MVP E1 (`plans/features/F02-mvp-asd-backlog/plan.md`) · ASD F02 §6.2 (AD-2, AD-4, AD-5), §8 · requisiti RF-26/27 · Costituzione §3.1 (stack)
> **Nota di processo**: il Gate 2 meccanico richiede un ASD per questa iniziativa; l'architettura è già ratificata nell'ASD F02 (applicabile per referenza). Il piano qui sotto, con l'ASD ereditato per referenza, costituisce l'artefatto di Gate 2 (deviazione di forma documentata: ASD F02 ∈ vincoli, nessuna nuova decisione architetturale necessaria).

## 1. Contesto

Prima iniziativa di sviluppo dell'MVP (Release 0.1). Crea le fondamenta tecniche (workspaces, toolchain, schema DB, CI) e l'autenticazione con RBAC a 4 ruoli. Da qui in poi si entra nel codice applicativo (`client/`, `server/`, `shared/`) — Gate 2 barrier governato da `state.json`.

## 2. Scope (storie E1 del backlog ratificato)

| Storia | Contenuto | Stima |
|---|---|---|
| E1.1 | Scaffold npm workspaces (`client` React+Vite, `server` Fastify, `shared` tipi/Zod), ESLint+Prettier, Vitest, `npm run build/lint/typecheck/test`, CI (lint→typecheck→test→build) | M |
| E1.2 | Schema Drizzle + migrations (tabelle ASD §8) + seed scenari mockup (in linea/a rischio/in ritardo, sovra-allocazione) | M |
| E1.3 | Login JWT: `POST /auth/login`, cookie httpOnly/Secure/SameSite, bcrypt, `POST /auth/logout`, `GET /auth/me` + test integrazione | M |
| E1.4 | Middleware RBAC (Amministratore/PM/Membro/Osservatore) + test matrice permessi | M |

## 3. Criteri di Accettazione

- `npm run build` / `lint` / `typecheck` / `test` tutti verdi in CI
- Login: credenziali valide → cookie JWT; invalide → 401 senza leak di informazioni
- `GET /auth/me` restituisce ruolo; RBAC blocca accesso non autorizzato (matrice test 4×CRUD)
- Migrations applicabili da zero su DB vuoto; seed riproducibile
- Password: bcrypt ≥ 10 round; nessun secret committato (Principio II)

## 4. Fuori Ambito

SSO (v1.1), gestione utenti UI (E2+), notifiche.

## 5. Revision Log

- **2026-09-17** - v0.1.0 - agent/GLM-5.3-Flash - PRD da backlog E1 ratificato.
