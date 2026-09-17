# CLAUDE.md

Repository guidelines for Claude Code CLI.

> Governed by `CONSTITUTION.md`.

## Key Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- SDD Gate Status: `sdd-gate.ps1 status` (via `.claude\skills\project-init-kit\scripts\sdd-gate.ps1`)
- SDD Gate Advance: `sdd-gate.ps1 advance <initiative-id> <gate>`

## Architecture & Conventions
- Language/Runtime: TypeScript ES2022+, Node.js 20 LTS
- Framework: React 18 + Vite (client/), Fastify (server/), SQLite (data layer)
- Code style: Strictly adhere to existing patterns in surrounding files.
- Testing: All logic must have automated tests (Vitest); verify with `npm test` before finalizing.
- Commit conventions: Conventional Commits with `[claude/<model>]` agent tag.

## Strict Rules
- **Declare operator role**: The operator `MUST` state their role (architect / product / dev / test / ops / security) at the start of an interaction; if unstated, ask before proceeding — no fallback assumption.
- **Skill-first**: Before any substantive action, check whether an authorized skill can perform or verify it; hand-rolled execution is the fallback.
- **No code without constitution**: Never write, scaffold, or generate application code unless `CONSTITUTION.md` exists and is ratified.
- **SDD Gate 2 Mechanical Barrier**: Never modify application code in `client/**`, `server/**`, `shared/**` unless Gate 2 (Architecture & Task Plan) is ratified in `state.json`. Run `sdd-gate.ps1 status` first.
- **Supervisor & Orchestrator Workflow**: Conduct feature delivery through the SDD lifecycle. Check active gates before dispatching domain skills (`g-e-asd-create` for ASD, `g-e-coding` for implementation, `g-qe-*` for verification, `frontend-design` for mockup per RF-28).
- **File locations (Single Org / Root Mode)**: docs in `docs/<ID>/phase-<N>-<name>/`, context inputs in `input/context/`, plans in `plans/<type>/<ID>/`. Never create arbitrary roots.
- **Supervised mode**: This project runs the `Supervised` autonomy profile (Constitution §4); only test/verify and read-only commands are pre-allowed — everything else requires approval.
- **SDD flow stamp**: Governed artifacts `MUST` carry `flow: {phase, producer, consumer, gate}` metadata per `SDD-FLOW.md`; unstamped artifacts are out-of-flow.
- **Git authorization**: No file writes without an authorized branch/worktree; if already on a branch, ask "continue here, or commit and open a new branch?"
- **Ownership alerts**: Team Mode active — surface `[OWNERSHIP ALERT]` when operator identity differs from `state.json` owner.
- Never expose secrets or API keys.
- Do not make unsolicited architectural changes or touch unrelated files.
- Always run linters and tests after modifications.

<!-- Review & Feedback Workflow (VS Code): fr4nz82.comment-md not detected — omitted. -->
