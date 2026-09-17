# SDD Delivery Flow — WebSupervisor

<!--
  SDD-DRIVEN SDLC FLOW (materialized by the project-init-kit skill)
  This document is the project's lifecycle reference. The project Constitution mandates
  that EVERY document or code artifact is created only after checking this flow.
-->

- **Version**: 1.0.0
- **Date**: 2026-09-17
- **Author**: agent/GLM-5.3-Flash (operator: Massimo Porcini)
- **Governed by**: `CONSTITUTION.md` (this flow is referenced by its Specification-Driven Delivery principle)
- **Registry**: local registries — Globant: `C:\Users\massimo.porcini\Documents\globant.ai.skills` · Personal: `C:\Users\massimo.porcini\Documents\my.skills`

## Revision Log
- **2026-09-17** - v1.0.0 - agent/GLM-5.3-Flash - Initial flow materialized during project bootstrap.

---

## How to use this flow (mandatory check)

Before creating **any governed artifact**, the acting agent `MUST`:

1. **Identify the phase** — locate the current phase (0–7) for this piece of work in the master flow below.
2. **Verify inputs** — confirm the phase's required input artifacts exist and their gates have passed. If an input artifact is missing, produce it first (in its own phase order) or stop and ask.
3. **Produce the output** — create the phase's output artifact and record its producer and consumer in the lineage table.
4. **Never skip** — phases and gates are sequential; the only permitted re-entry is the feedback loop (7 → 1).
5. **No unilateral lifecycle deviations or inferred compromises** — the canonical sequence (`Brief` → `PRD` → `ASD` → `Epics` → `Backlog/Tasks` → `Plan Backlog` → `Implement`) `MUST` be preserved. Inferred trade-offs `MUST` be submitted to the operator for explicit decision.

> **Proportionality**: the full check applies to **feature/component work and deliverable artifacts**. **Minor documents** require the flow stamp only.

> **Fallback rule**: when a named `g-*` skill is not provisioned in this repository, the agent `MUST` perform the phase's intent manually (same artifact, same gate). If another provisioned skill covers the intent, prefer it.

## Flow stamp (machine-checkable metadata)

```yaml
flow:
  phase: <0-7>
  producer: <skill-name|role>
  consumer: <phase|skill|role>
  gate: <gate-name|evidence-ref|n/a>
```

- **Markdown documents**: flow stamp in YAML frontmatter (or fenced block under the title).
- **Code files**: flow stamp in a language-appropriate header comment, or in the PR/task description.
- Artifacts without a flow stamp `MUST` be treated as out-of-flow and flagged for correction.

## The master flow — 8 phases, one loop

| # | Phase | Purpose | Input skills (recommended) | Output artifacts | Consumed by |
|---|---|---|---|---|---|
| 0 | Constitution | Ratify the non-negotiable contract | `project-init-kit` | `CONSTITUTION.md` + agent configs | ALL phases |
| 1 | Specify | Define the WHAT & WHY | `g-e-sentbyclient-intake`, `g-e-project-brief-create`, `g-p-generate-prd` | Intake Pack, Project Brief (`[TBD]` gaps), PRD + Gap report | Phases 2–4 |
| 2 | Clarify | Remove ambiguity before architecture | `g-d-brief-reviewer`, `g-e-presales-q-and-a`, `g-qe-preventive-analyzer` | Scope Readiness Report, Q&A records | Phase 3 |
| 3 | Plan | Architecture-to-operations chain | `g-e-asd-create`, `g-e-integration-contracts`, `g-e-development-toolchain-create`, `g-qe-*` (test strategy) | ASD, DTR, integration contracts, security plan, test strategy | Phase 4 |
| 4 | Tasks | Decompose into executable work | `g-p-backlog-structure`, `g-p-decompose-epic`, `g-e-implementation-plan` | Epic/story backlogs, master backlog, roadmap, test plans | Phase 5 |
| 5 | Implement | Every task ships code AND its tests | `g-e-coding`, `g-e-testing-implementation`, `g-qe-unit-tests-generator` | Code + tests per task | Phase 6 |
| 6 | Verify & Release | Prove it, then gate the release | `g-qe-*`, `g-e-release-checklist` | Test execution evidence, defect reports, GO/NO-GO, release notes | Phase 7 |
| 7 | Operate & Improve | Production evidence → next specification | `g-e-identify-technical-debt`, `g-e-performance-review` | RCAs, tech-debt inventory, KPI gaps, usability insights | Phase 1 (next cycle) |

**Quality gates (nothing advances without evidence)**:

| Gate | Between | Evidence required |
|---|---|---|
| Scope Readiness | 2 → 3 | Brief review readiness = ready; `[TBD]` resolved or consciously accepted |
| Feasibility | 3 → 4 | ASD validated vs PRD; GAP analysis clean; strategies signed off |
| PR Review | 5 → 6 | All stories implemented with tests; PRs merged (BLOCKER/MAJOR cleared) |
| Release | 6 → 7 | Release gate = GO; security & performance sign-offs recorded |

**Feedback loop**: Phase 7 → Phase 1.

## Project-specific Specify inputs

- `input/context/requisiti-web-project-manager-v1.0.md` — Documento dei Requisiti v1.0 (RF-01..RF-30, RNF-01..RNF-08, user stories, ruoli).
- Mockup ad alta fedeltà (RF-28..RF-30) via `frontend-design`: parte del ciclo Specify/Verify prima dell'MVP.

## Cross-cutting governance (every phase, no exceptions)

- **Iron Law**: no code or artifact without a ratified `CONSTITUTION.md`.
- **Human-in-the-loop checkpoints**: client Q&A answers (1–2) · backlog approval (4) · mockup validation (stakeholder, RF-30) · release go/no-go (6).
- **Decision Non-Usurpation**: all process trade-offs submitted to the operator for decision.
- **Continuous monitoring**: recurring checkpoints for risks, KPI gaps, and quality trends.

## Minimal viable chain (small projects)

```
Frame:   project-init-kit → intake → Project Brief → PRD → g-d-brief-reviewer ◆
Plan:    ASD → feasibility ◆ → integration contracts → test strategy → backlog
Build:   implementation plan → coding → unit tests → PR review → test execution
Ship:    report → release gate ◆ → release checklist → go-live
Operate: RCA + KPI gaps → next cycle's Specify
```

## Artifact lineage (traceability)

```
CONSTITUTION.md → Intake Pack → Project Brief → PRD → ASD + DTR + Contracts
→ Strategy suite (DevOps/Security/Test) → Master Backlog + Roadmap
→ Code + tests → PR review sign-off → Reports + dashboards
→ Release gate GO → RCA · debt · KPI → next Specify
```
