# Agent Operational Guide (`AGENTS.md`)

Welcome! This workspace uses AI-assisted development. This guide provides instructions for AI coding agents (Claude Code, and any other agent admitted by governance).

> **Governing Document**: All rules below derive from `CONSTITUTION.md`. In case of any conflict, `CONSTITUTION.md` takes precedence.
>
> 🛑 **IRON LAW (NO CODE WITHOUT CONSTITUTION)**:
> No code (features, bugfixes, modules, scripts, or application scaffolding) `MUST` or `CAN` be created unless `CONSTITUTION.md` is present and ratified in this repository.

> **Version**: 1.0.0 · **Revision Log** and **Addenda** at the bottom of this document.

---

## 1. Project Quick Start & Verification Commands

Before declaring any task complete, run these verification commands *(commands are ratified conventions for the approved stack; populate exact scripts when `package.json` is scaffolded)*:

| Action | Command | Expected Result |
|---|---|---|
| **Build** | `npm run build` | Clean exit code 0 |
| **Lint** | `npm run lint` | 0 errors, 0 warnings |
| **Typecheck** | `npm run typecheck` | 0 type diagnostics |
| **Test** | `npm test` | All test suites pass |

---

## 2. Directory Layout & Architecture

```
WebSupervisor/
├── CONSTITUTION.md        # Governing contract (Iron Law)
├── SDD-FLOW.md            # SDD lifecycle reference
├── AGENTS.md / CLAUDE.md  # Agent rule files (derived)
├── .claude/               # Claude Code config, hooks, skills (junctions)
├── input/context/         # Source requirements & context documents (writable)
├── docs/                  # Phase artifacts: docs/<ID>/phase-<N>-<name>/
├── plans/                 # Initiative plans + state.json (Principle IX)
├── client/                # React + Vite frontend (presentation)
├── server/                # Fastify backend (API, domain logic)
└── shared/                # Shared TypeScript types & contracts
```

- **Domain / Core Logic**: `server/src/domain` — Pure business logic; no UI or direct DB dependencies.
- **Data / Services**: `server/src/data` — SQLite models, migrations, external integrations.
- **Presentation / API**: `client/src` (React/Vite) and `server/src/routes` (Fastify routes/controllers).
- **Tests**: co-located `*.test.ts` + integration suites (Vitest).

*(Layout ratified as convention; created at Gate 2 of the first initiative — do not scaffold before.)*

---

## 3. Working Principles for Agents

### What to Do (MUST DO):
- **Declare Operator Role (first, every interaction)**: The operator `MUST` state their role at the start of an interaction (`architect`, `product`, `dev`, `test`/`qe`, `ops`, `security`). If unstated, the agent `MUST` ask before proceeding.
- **Verify Constitution First**: Confirm `CONSTITUTION.md` is present and active before authoring, modifying, or scaffolding code.
- **Git Context & Initiative Binding**: Determine where you are before acting (`git status`, branch/worktree). Never start write activity without an authorized branch/worktree. On an initiative branch, run `sdd-gate.ps1 status` (via `.claude/skills/project-init-kit/scripts/sdd-gate.ps1`) to bind to the initiative's `state.json`. If on `main`, ask the user to switch or create an initiative branch before any writes.
- **Ownership Alert Handling**: Team Mode is active — if the current operator identity differs from the `owner` recorded in `state.json`, surface an `[OWNERSHIP ALERT]` and confirm co-authoring before modifying initiative files.
- **Documentation, Context, & Plans Locations (Single Org / Root Mode)**: docs under `./docs/<ID>/phase-<N>-<name>/`, context inputs under `./input/context/`, plans under `./plans/epics|features|fixes/<NN|F[NN]>-<slug>/`.
- **Supervised Mode**: This project runs the **`Supervised`** autonomy profile. Only test/verify commands and read-only operations are pre-allowed; every other edit, write, or shell command requires explicit user approval.
- **Skill-First**: Before any substantive action, check whether an authorized skill (§4) can perform or verify it. Hand-rolled execution is the fallback.
- **Flow Check**: Before creating any governed artifact, consult `SDD-FLOW.md`: identify the phase (0–7), verify inputs/gates, and stamp the artifact with `flow: {phase, producer, consumer, gate}` metadata.
- **Understand Before Editing**: Search and read existing code to adopt prevailing patterns.
- **Small, Focused Changes**: Implement the exact scope requested. Keep diffs concise.
- **Self-Verification**: Always run linting and tests after modifying code.
- **Commit Message Convention**: `[agent/model]` tag — e.g. `feat(auth): [claude/GLM-5.3-Flash] add login endpoint`.
- **Update Tests**: Add or update test cases whenever adding features or fixing bugs.
- **Best-Practice Defaults**: When the user is undecided, propose a best-practice default with rationale, record it, and ask for confirmation.
- **Surface Lifecycle Deviations**: Articulate trade-offs, present structured options, pause for the operator's decision.

### What NOT to Do (MUST NOT DO):
- **No Code Without Constitution**: Never create, generate, scaffold, or commit application code if `CONSTITUTION.md` does not exist.
- **No Unilateral Lifecycle Deviations**: Never adopt shortcuts in the SDLC chain without explicit operator authorization.
- **No Code Without Gate 2**: Never write or edit application source code (`client/**`, `server/**`, `shared/**`) without verifying Gate 2 is `passed` in `state.json`.
- **No Document, Context, or Plan Misplacement**: Never create arbitrary roots outside `./docs/`, `./input/`, and `./plans/`.
- **No Out-of-Flow Artifacts**: Never create artifacts without the flow stamp.
- **No Secret Leaks**: Never print or commit `.env` files, API keys, or credentials.
- **No Destructive Commands**: Never run `git push --force`, `git reset --hard`, or recursive deletion outside build targets.
- **No Premature Abstractions**: Avoid complex inheritance trees, unused helpers, unnecessary boilerplate.
- **No Unsolicited Refactoring**: Do not reformat entire files or change unaffected modules unless explicitly asked.

---

## 4. Active Agent Skills

Skills are installed via junctions in `.claude/skills/` (Claude Code) and `.opencode/skills/`:

| Category | Skills | Source |
|---|---|---|
| Governance | `project-init-kit` | local: `Documents\my.skills\project-init-kit` |
| Anthropic product | `docx`, `pdf`, `pptx`, `xlsx`, `doc-coauthoring`, `internal-comms` | local: `Documents\my.skills\Antropic\` |
| Design / frontend | `frontend-design`, `canvas-design`, `web-artifacts-builder`, `webapp-testing`, `theme-factory`, `algorithmic-art`, `brand-guidelines` | local: `Documents\my.skills\Antropic\` |
| Engineering (`g-e-*`) | asd-create/extract, bug-fix, coding, development-toolchain-create/extract, identify-technical-debt, implementation-plan, integration-contracts, performance-review, presales-q-and-a, project-brief-create/technical, release-checklist, review-pr, sentbyclient-intake, technical-feasibility, testing-implementation | local: `Documents\globant.ai.skills\Engineenirg Studio\` |
| Quality Engineering (`g-qe-*`) | a11y-scanner, api-*, automation-code-generator, bug-pusher, bug-report-writer, exploratory-tester, framework-architect, mcp-test-executor, mobile-* | local: `Documents\globant.ai.skills\Quality Engineering\` |
| Utility | `skill-creator`, `mcp-builder`, `claude-api`, `slack-gif-creator` | local registries |

Local registry paths (persisted at user level): Globant: `C:\Users\massimo.porcini\Documents\globant.ai.skills` · Personal: `C:\Users\massimo.porcini\Documents\my.skills`. Registry contents `MUST NOT` be modified from this project.

---

## 5. Review & Feedback Workflow (VS Code)

Not active — `fr4nz82.comment-md` extension not detected in this environment.

---

## 6. Revision Log & Addenda

### Revision Log
- **2026-09-17** - 1.0.0 - Initial AGENTS.md generated via `project-init-kit` skill (operator: Massimo Porcini).

### Addenda
- *(minor changes recorded here, one line each: date — note — author)*
