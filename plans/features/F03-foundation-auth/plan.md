# Initiative Plan: F03-foundation-auth

---
initiative:
  id: F03-foundation-auth
  type: feature
  status: in_progress
  owner: Massimo Porcini (Engineering)
  vendor: none
flow: {phase: 5, producer: agent/GLM-5.3-Flash, consumer: phase-5-implement (E1.1–E1.4), gate: gate_2_architecture}
---

## 1. Summary

Fondamenta tecniche e autenticazione dell'app WebSupervisor: npm workspaces + toolchain + CI (E1.1), schema DB/migrations (E1.2), login JWT con cookie httpOnly (E1.3), RBAC 4 ruoli (E1.4). Prima iniziativa di sviluppo dell'MVP (Release 0.1).

## 2. Alignment

- **SDD Delivery Flow**: governed by `SDD-FLOW.md` and `CONSTITUTION.md`.
- **Active Branch**: `agent/003-foundation-auth`
- **Input**: `docs/F03-foundation-auth/phase-1-specify/prd.md` (Gate 1 PASSED) · `docs/F02-mvp-asd-backlog/phase-3-plan/asd.md` (ASD di sistema) · backlog E1
- **Architecture**: `docs/F03-foundation-auth/phase-3-plan/asd.md` (eredità ASD F02, nessuna nuova decisione)

## 3. Scope

- **In scope**: E1.1 scaffold workspaces/toolchain/CI · E1.2 schema Drizzle + migrations + seed · E1.3 login JWT · E1.4 RBAC con matrice di test.
- **Out of scope**: CRUD progetti (E2), gestione utenti UI, SSO, feature successive.

## 4. Approach

Implementazione per storie in ordine E1.1 → E1.4; ogni storia con i propri test (Vitest unit+integration, `server` con Fastify inject e DB in memoria). Conforme all'ASD F02 (AD-2/4/5). UI client non richiesta in questa iniziativa (solo API + fondamenta client).

## 5. Progress & Status

- [x] Gate 1: Specify (PRD) — PASSED 2026-09-17
- [ ] Gate 2: Architecture & Tasks (ASD iniziativa + piano ratificati)
- [ ] Gate 3: Implementation & Tests (E1.1–E1.4)
- [ ] Gate 4: Verification & Release

### Work Log

- **2026-09-17T19:55:48Z** — Initiative initialized by Massimo Porcini (Engineering).
- **2026-09-17** — Gate 1 passed (PRD); ASD di iniziativa redatto (eredità ASD F02 + dettagli E1).

## 6. Revision Log

- **2026-09-17** - v0.2.0 - agent/GLM-5.3-Flash - Piano popolato con scope/approach E1 e allineamento ASD.
