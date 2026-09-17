# Initiative Plan: {{INITIATIVE_TITLE}}

<!--
  INITIATIVE PLAN (one per epic / feature / fix — Constitution Principle IX)
  Stored at: ./plans/{epics|features|fixes}/<NN|F[NN]>-<short-slug>/plan.md
  (Multi-Vendor mode: ./teams/<vendor>/plans/{epics|features|fixes}/<NN|F[NN]>-<short-slug>/plan.md)
  Statuses: drafted -> in-progress -> completed | abandoned
  Never delete checklist items — append dated updates so the track record is preserved.
-->

---
initiative:
  id: {{INITIATIVE_ID}}            # e.g. F01 (feature) / 001 (fix or epic)
  type: {{INITIATIVE_TYPE}}        # epic | feature | fix
  status: drafted
  owner: {{OWNER}}
flow: {phase: 0, producer: {{PRODUCER}}, consumer: {{CONSUMER}}, gate: {{GATE}}}
---

## 1. Summary

One paragraph: what this initiative is, why it exists, and what "done" means.

## 2. Alignment

- **SDD flow**: governed by `SDD-FLOW.md` (or `sdd-flow.md`, Constitution Principle VII); current phase noted in the flow stamp above.
- **Overarching context**: parent epic / related initiatives / global backlog entries this plan reconciles with.

## 3. Scope

- **In scope**: ...
- **Out of scope**: ...

## 4. Approach

Brief description of the planned approach; reference detailed specs under `docs/` (or `teams/<vendor>/docs/` in multi-vendor mode) (Principle VIII). Do not duplicate spec content here.

## 5. Progress & Status (keep up to date)

- [ ] Specified (phase 1 artifacts ratified)
- [ ] Designed (phase 2-3 gates passed)
- [ ] Implemented (phase 4-5 gates passed)
- [ ] Verified (tests/lint/typecheck pass)
- [ ] Documented (docs/ or teams/<vendor>/docs/ artifacts stamped)
- [ ] Delivered

### Work Log (append-only)

- **{{DATE}}** — Plan drafted by {{AUTHOR}}.

## 6. Revision Log

- **{{DATE}}** - v0.1.0 - {{AUTHOR}} - Initial plan created via `project-init-kit`.
