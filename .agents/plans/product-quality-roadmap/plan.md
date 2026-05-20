# Implementation Plan: Product Quality Roadmap

## Overview

Draft and maintain a roadmap that moves `mai` from a v0.1 scheduling core and web workspace into a product-grade open source appointment scheduling toolkit. The roadmap should preserve the headless Rust core, identify product-quality gaps, and sequence work toward a library quality bar comparable to mature calendar packages.

## Architecture Decisions

- Keep `docs/roadmap.md` as the durable public-facing roadmap because it belongs with the functional and technical specs.
- Keep this plan under `.agents/plans/product-quality-roadmap/` because repository workflow requires feature planning artifacts before implementation.
- Treat advanced scheduling concepts such as recurrence, capacity, holds, and multi-resource booking as later phases that require their own specs before implementation.
- Avoid changing core or web code while drafting the roadmap; this task is documentation and planning only.

## Task List

### Phase 1: Discovery

- [x] Task 1: Read repository rules and relevant skills.
  - Acceptance: Local `.agents/rules/*.md` and applicable skill docs are reviewed.
  - Verify: Roadmap follows local workflow and naming constraints.
  - Files: `.agents/rules/*.md`, `.agents/skills/**/SKILL.md`

- [x] Task 2: Read current specs and project baseline.
  - Acceptance: Roadmap reflects current Rust core, wasm adapter, web packages, and example app.
  - Verify: Current capabilities are summarized without claiming unimplemented future features as done.
  - Files: `docs/functional_spec.md`, `docs/technical_spec.md`, `README.md`, `DESIGN.md`

### Phase 2: Roadmap Draft

- [x] Task 3: Create durable roadmap document.
  - Acceptance: Roadmap defines vision, positioning, principles, phases, quality checklist, priority order, and open questions.
  - Verify: Document is readable as a standalone product roadmap.
  - Files: `docs/roadmap.md`

- [x] Task 4: Align roadmap phases with implementation boundaries.
  - Acceptance: Core, adapter, UI, docs, backend integration, and ecosystem work are separated.
  - Verify: Advanced scope does not violate the current headless core boundary.
  - Files: `docs/roadmap.md`

### Phase 3: Review and Follow-Up

- [x] Task 5: Human review of product direction.
  - Acceptance: Product owner confirms priority order and answers key open questions.
  - Verify: Update `docs/roadmap.md` with accepted decisions.
  - Files: `docs/roadmap.md`

- [x] Task 6: Convert accepted near-term roadmap into milestone specs.
  - Acceptance: Phase 1 and Phase 2 roadmap items are broken into implementation plans with acceptance criteria.
  - Verify: New plans exist under `.agents/plans/` before code changes.
  - Files: `.agents/plans/*`, `docs/functional_spec.md`, `docs/technical_spec.md`

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Roadmap expands into generic calendar scope too early | High | Prioritize appointment booking and defer general calendar/event concepts. |
| UI ambitions leak into the Rust core | High | Keep core output semantic and push visual behavior to web packages. |
| Advanced scheduling breaks fixed-slot consumers | High | Require separate specs and versioned contracts before implementing advanced features. |
| Open source adoption is blocked by docs gaps | Medium | Treat docs, examples, and payload catalogs as roadmap deliverables. |
| Framework-specific UI limits adoption | Medium | Decide adapter strategy before broad UI expansion. |

## Open Questions

- Which UI adapter should be first-class after Vue: React, Web Components, or framework-agnostic primitives?
- Should recurrence produce generated slots, or become a first-class domain concept?
- What package names and publishing targets should be reserved before the next release?
- What browser support matrix should the UI package commit to?
- Should backend integration examples start with PostgreSQL, Supabase, or a minimal REST service?

## Checkpoint

- [x] Roadmap drafted.
- [x] Plan artifact created.
- [x] Human review complete.
- [x] Follow-up implementation milestones approved.
