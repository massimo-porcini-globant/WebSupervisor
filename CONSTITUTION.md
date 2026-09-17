# Project Constitution

<!--
  PROJECT CONSTITUTION (Single Source of Truth)
  This document establishes the governing rules, architectural boundaries,
  quality gates, and operational constraints for both human contributors and
  autonomous AI agents working in this repository.
-->

- **Version**: 1.0.0
- **Date**: 2026-09-17
- **Project**: WebSupervisor — Applicazione Web per la Gestione dei Progetti
- **Autonomy Profile**: `Supervised`

## Revision Log
- **2026-09-17** - v1.0.0 - Initial Constitution drafted via `project-init-kit` skill (author: agent/GLM-5.3-Flash, operator: Massimo Porcini).

---

## 1. Governance & Authority

- **Authority Level**: This Constitution is the authoritative document for repository conventions, architectural patterns, and security constraints.
- **The Constitution-First Gate (Iron Law)**: **No code (application logic, features, bugfixes, modules, scripts, or scaffolding) `MUST` or `CAN` be created in this repository unless this Constitution is established, ratified, and active.** Any request or attempt to author application code without an active Constitution `MUST` be refused and halted until this document is ratified.
- **Rule Precedence**: If any agent instruction file (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`) or tool configuration contradicts this document, **this Constitution supersedes**.
- **RFC 2119 Interpretation**: The key words `MUST`, `MUST NOT`, `REQUIRED`, `SHALL`, `SHALL NOT`, `SHOULD`, `SHOULD NOT`, `RECOMMENDED`, `MAY`, and `OPTIONAL` in this document are to be interpreted as described in RFC 2119.

---

## 2. Core Non-Negotiable Principles

### Principle I: Simplicity & Directness
- Code `MUST` be written for readability and maintainability over cleverness.
- Unnecessary abstractions, speculative generalization, and premature optimizations `MUST NOT` be introduced.
- Existing patterns and idioms found in the codebase `MUST` be followed.

### Principle II: Zero-Trust Security & Secrets
- Secrets, credentials, API tokens, and private keys `MUST NOT` be committed to source control or logged in console output.
- All external inputs (user inputs, webhook payloads, query parameters) `MUST` be validated and sanitized using strict schema definitions (e.g. Zod / Fastify JSON Schema) before processing.
- Database queries `MUST` use parameterized queries or type-safe ORM abstractions (e.g. better-sqlite3 prepared statements / Drizzle) to prevent injection vulnerabilities.
- Authentication `MUST` follow the role model defined in the requirements (Amministratore, Project Manager, Membro del team, Osservatore); authorization checks `MUST` be enforced server-side on every endpoint.

### Principle III: Testing & Quality Verification
- Every new feature or bugfix `MUST` be accompanied by automated tests (unit + integration; Vitest as default runner).
- Code changes `MUST NOT` break existing tests or decrease coverage below project thresholds.
- Code `MUST` pass all linters, type checks, and formatting checks before merging.
- Flaky tests or tests with arbitrary sleep statements `MUST NOT` be committed.

### Principle IV: Architectural Boundaries
- Separation of concerns `MUST` be maintained across layers: frontend React/Vite (`client/`), backend Fastify (`server/`), shared contracts/types (`shared/`).
- Circular dependencies between modules `MUST NOT` be introduced.
- Third-party dependencies `SHOULD NOT` be added without explicit justification and vulnerability verification (`npm audit`).

### Principle V: Document Revision Metadata
- Every document generated in this repository (documentation, design specs, reports, agent rule files, templates) `MUST` carry revision metadata (version, date, author, change summary).
- Documents `MUST NOT` be merged or committed without their revision metadata kept up to date.

### Principle VI: AI Agent Execution Isolation
- **Context detection first**: Before creating any artifact, agents `MUST` inspect the current git context (worktree, active branch).
- **Isolation gate**: Agents `MUST` ask the user whether to isolate the work in a new worktree or new branch before generating any artifact, unless already on a designated branch.
- **Default-branch protection**: Artifacts `MUST NOT` be created directly on `main` without explicit user approval.
- **Branch naming**: Agent-created branches `MUST` follow `agent/<NNN>-<short-slug>` (features/fixes) or `chore/<slug>`; stacked branches extend the parent name (`agent/003.1-fix-login`).
- **No silent reuse**: Dirty working trees, detached `HEAD`, or pre-existing branches `MUST NOT` be silently reused; report and confirm first.
- **No writes without authorization**: No write activity `MUST` start without an authorized branch or worktree.

### Principle VII: Specification-Driven Delivery Flow & SDD State Machine
- The ratified SDD delivery flow (materialized at `./SDD-FLOW.md`) is the mandatory lifecycle reference for feature/component design and build — greenfield and brownfield.
- **Deterministic Gating & State Machine**: Work progresses through four hard gates evaluated by `sdd-gate.ps1` (`.claude/skills/project-init-kit/scripts/sdd-gate.ps1` or project fallback `scripts/sdd-gate.ps1`):
  - **Gate 1 (Specify)**: Initiative PRD (`docs/<ID>/phase-1-specify/prd.md`) exists with scope, functional requirements, and acceptance criteria.
  - **Gate 2 (Architecture & Tasks)**: ASD (`docs/<ID>/phase-3-plan/asd.md`) and Initiative Task Plan (`plans/<type>/<ID>/plan.md`) ratified.
  - **Gate 3 (Implementation & Test)**: Application code accompanied by unit and integration tests.
  - **Gate 4 (Verify & Release Clearance)**: Test execution evidence and release sign-off recorded (`docs/<ID>/phase-6-verify/release-notes.md`).
- **The Gate 2 Code Barrier (Mechanical Halting)**: Writes and edits to application source code (`client/**`, `server/**`, `shared/**`) `MUST NOT` proceed unless Gate 2 is ratified and cleared in `state.json` via `sdd-gate.ps1 advance <ID> gate_2_architecture`.
- **Proportionality Tiers**:
  - **Tier 1 (Feature / Epic — `F[NN]-<slug>`)**: Full lifecycle. Gates 1, 2, 3, and 4.
  - **Tier 2 (Bugfix / Tech Debt — `FIX-[NN]-<slug>`)**: Fast-track. Gate 1 bypassed; requires Root Cause & Fix Plan in `plans/fixes/<ID>/plan.md` (Gate 2) + Tests and Implementation (Gate 3).
  - **Tier 3 (Chores / Docs — `CHORE-<slug>`)**: Exempt from code gates; requires flow stamp metadata only.
- Phases and gates `MUST NOT` be skipped; the only permitted re-entry is the feedback loop (Operate → Specify). When a named `g-*` skill is not provisioned, the agent `MUST` perform the phase's intent manually — the artifact remains mandatory.
- **Decision Non-Usurpation**: Agents `MUST NOT` unilaterally alter, compress, skip, or compromise the canonical progression (`Brief` → `PRD` → `ASD` → `Epics` → `Backlog/Tasks` → `Plan Backlog` → `Implement`). Inferred trade-offs `MUST` be surfaced to the operator with options and paused for decision.
- Every governed artifact `MUST` carry the **flow stamp** (`phase`, `producer`, `consumer`, `gate` per `SDD-FLOW.md`); unstamped artifacts are out-of-flow.
- The source requirements document (`input/context/requisiti-web-project-manager-v1.0.md`) is the canonical Specify-phase input for this project.

### Principle VIII: Input Context, Documentation Locations
- **Single Organization (Root Mode — active)**:
  - Source and context documents (briefs, requirements, notes) `MUST` be stored in `./input/context/` (writable).
  - Phase artifacts `MUST` be stored under `./docs/<ID>/phase-<N>-<name>/`, keyed to the flow stamp's `phase` field.
  - `./plans/` is the second documentation root for initiative plans; plans `MUST NOT` be mixed into `./docs/` and vice versa.

### Principle IX: Initiative Plans, Machine State, & Ownership
- Every feature, fix, or component designed and built `MUST` have a plan — one per initiative — stored in `./plans/`:
  - `./plans/features/F[NN]-<short-slug>/`
  - `./plans/fixes/NN-<short-slug>/`
  - `./plans/epics/NN-<short-slug>/`
- **Machine-Readable Initiative State (`state.json`)**: Every initiative directory `MUST` maintain a `state.json` initialized and managed by `sdd-gate.ps1` at `./plans/<type>/<ID>/state.json`.
- **Operator Identity & Role Binding**: Each initiative records an `owner` (name, email, role). This project operates in **Team Mode**: if an operator whose identity differs from the recorded owner attempts to modify the initiative, the runtime guard `MUST` output an `[OWNERSHIP ALERT]` requiring co-authoring confirmation.
- Each plan `MUST` include a progress/status checklist kept up to date.
- Plans `SHOULD` be produced via the provisioned `g-*` planning skills (skill-first, §4.6); hand-rolled production is the fallback.

---

## 3. Technology Stack & Canonical Commands

### 3.1 Ratified Stack

- **Language & Runtime**: TypeScript (ES2022+), Node.js 20 LTS
- **Framework**: Frontend React 18 + Vite · Backend Fastify
- **Database**: SQLite (embedded; WAL mode; migrations versioned in repo)
- **Package Manager**: npm (workspaces: `client/`, `server/`, `shared/`)
- **Build Command**: `npm run build`
- **Test Command**: `npm test` (Vitest)
- **Lint Command**: `npm run lint` (ESLint)
- **Typecheck Command**: `npm run typecheck` (tsc --noEmit)
- **Format Command**: `npm run format` (Prettier)

### 3.2 Deferred Decisions (Optional)

| Decision | Gated on | Candidates |
|---|---|---|
| Gantt library (RF-08..13) | Gate 2 (ASD) of first Gantt feature | frappe-gantt, dhtmlx-gantt, custom |
| Auth mechanism (RF-26: password vs SSO) | Gate 2 of auth initiative | fastify-jwt, OAuth2/SSO |
| Excel export library (RF-22..25) | Gate 2 of export feature | exceljs, sheetjs |
| ORM/query layer | Gate 2 of first data feature | better-sqlite3 raw, Drizzle, Kysely |

---

## 4. AI Agent Operational Bounds & Permissions

All AI agents operating in this repo `MUST` observe the following bounds:

1. **Constitution Prerequisite (Iron Law)**: Agents `MUST NOT` create, scaffold, or modify application code without first confirming this Constitution is in effect.
2. **Safety First**: Destructive shell commands (e.g. `rm -rf /`, `git reset --hard`, `git push --force`, database drops) are strictly forbidden without explicit human intervention.
3. **Autonomy Profile**: This project operates under the **`Supervised`** autonomy profile:
   - Only test/verify commands (and read-only inspection) are pre-allowed; every other edit, write, or shell command `MUST` prompt the user for approval.
4. **Respect Permissions**: Tool permissions defined in agent manifests (`.claude/settings.json`) `MUST` be respected.
5. **Authorized Skills**: Agents `MUST ONLY` invoke skills authorized for this project:
   - `project-init-kit` (governance & SDD gates)
   - Anthropic product skills: `docx`, `pdf`, `pptx`, `xlsx`, `doc-coauthoring`, `internal-comms`
   - Design/frontend skills: `frontend-design`, `canvas-design`, `web-artifacts-builder`, `webapp-testing`, `theme-factory`, `algorithmic-art`, `brand-guidelines`
   - Engineering skills: `g-e-asd-create`, `g-e-asd-extract`, `g-e-bug-fix`, `g-e-coding`, `g-e-development-toolchain-create`, `g-e-development-toolchain-extract`, `g-e-identify-technical-debt`, `g-e-implementation-plan`, `g-e-integration-contracts`, `g-e-performance-review`, `g-e-presales-q-and-a`, `g-e-project-brief-create`, `g-e-project-brief-technical`, `g-e-release-checklist`, `g-e-review-pr`, `g-e-sentbyclient-intake`, `g-e-technical-feasibility`, `g-e-testing-implementation`
   - Quality Engineering skills: `g-qe-*` (a11y-scanner, api-*, automation-code-generator, bug-pusher, bug-report-writer, exploratory-tester, framework-architect, mcp-test-executor, mobile-*)
   - Utility skills: `skill-creator`, `mcp-builder`, `claude-api`, `slack-gif-creator`
   - Sourced from approved local registries (`C:\Users\massimo.porcini\Documents\globant.ai.skills`, `C:\Users\massimo.porcini\Documents\my.skills`). Registry contents `MUST NOT` be modified from within this project.
6. **Skill-First**: Before performing any substantive action (create, test, scan, document, analyze, verify), the agent `MUST` check whether an authorized skill — or a composition of authorized skills — can perform or verify that action. Hand-rolled execution is the fallback, not the default. Trivial and read-only operations are exempt.
7. **Verification Loop**: Agents `MUST` run the relevant test and lint commands after completing edits before reporting completion.
8. **Scope Control**: Agents `MUST NOT` modify files outside the intended scope of the requested task or make unsolicited wholesale refactorings.
9. **Lifecycle Inferences & Decision Non-Usurpation**: Agents `MUST NOT` unilaterally adopt shortcuts, compromises, or deviations from the canonical delivery chain. All inferred process trade-offs `MUST` be surfaced to the human operator with options clearly laid out, pausing for the operator's decision.

---

## 5. Amendment Process

1. Changes to this Constitution require explicit review and approval by repository maintainers.
2. When this Constitution is amended, all derived agent configuration files (`AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`) `MUST` be updated to reflect the amendments.
3. Every amendment `MUST` record the date, author, and rationale in the Revision Log.
