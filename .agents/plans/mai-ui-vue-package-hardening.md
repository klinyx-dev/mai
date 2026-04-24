# Implementation Plan: `mai-ui-vue` Package Hardening

## Overview
Turn `web/packages/mai-ui-vue` into a robust, consistent, and easy-to-consume Vue UI package for scheduling use cases.

The target outcome is:
- clear package boundaries between presentational UI, interaction workflow, and integration helpers
- a smaller and more intentional public API
- stronger design-system consistency aligned with `DESIGN.md`
- lower wiring cost in the example app
- contract-focused tests that protect real consumer behavior

## Architecture Decisions
- Keep `MaiBoard` as the low-level presentational entry point.
- Keep `MaiBoardInteractive` as the high-level batteries-included entry point, but reduce and group its surface area.
- Keep `useMai` and Nuxt-specific glue in the same package for now, but isolate them under an explicit integration layer rather than treating them as peer concepts to UI primitives.
- Preserve backward compatibility where practical during refactor, but prefer introducing stable compatibility shims over letting internal structure leak into exports.

## Phase 1: Package Boundary Cleanup

### Task 1: Formalize internal layer ownership
Define and enforce three internal layers:
- `board/ui`: pure rendering primitives and presentational subcomponents
- `interactive`: selection state, draft logic, action orchestration, command mapping
- `integration`: `useMai`, Nuxt plugin state, adapter-facing convenience helpers

Acceptance criteria:
- every source file clearly belongs to one of the three layers
- no presentational file imports command-building or integration helpers
- no Nuxt/integration concern is imported from board UI modules

Verification:
- `rg` import scan shows no cross-layer violations outside the approved boundaries
- `pnpm --filter @mai/mai-ui-vue build`

### Task 2: Introduce stable barrel exports by responsibility
Create explicit internal barrels for:
- board UI
- interaction helpers
- integration helpers
- public types

Acceptance criteria:
- internal imports stop reaching into arbitrary deep paths when a local barrel exists
- public exports come from a small set of intended entry points

Verification:
- `pnpm --filter @mai/mai-ui-vue build`

### Checkpoint: Boundaries
- package structure is responsibility-driven, not file-history-driven
- no new behavior introduced yet

## Phase 2: Public API Simplification

### Task 3: Audit and reduce public exports
Review [web/packages/mai-ui-vue/src/index.ts](/Users/minhduc/Documents/Projects/klinyx/mai/web/packages/mai-ui-vue/src/index.ts) and classify exports as:
- primary public API
- advanced public API
- internal only

Remove or hide exports that are implementation detail leaks.

Acceptance criteria:
- `index.ts` reads as an intentional package surface, not a dump of internals
- consumer-facing exports are grouped by purpose
- types remain available from one stable `types` entry

Verification:
- example app still builds against intended exports
- `pnpm --filter @mai/mai-ui-vue build`

### Task 4: Simplify `MaiBoardInteractive` props
Refactor `MaiBoardInteractive` to group related props into coherent objects, while preserving a compatibility path during migration.

Recommended groups:
- `view`: title, subtitle, visible range, time label format, empty state
- `actor`: assignee, createdBy, appointment defaults
- `actions`: create/book/reschedule/cancel/delete handlers or mutate adapter

Acceptance criteria:
- the component no longer exposes a flat, oversized prop list as the primary developer path
- compatibility shim exists for current example-app usage or migration is performed in the example in the same phase
- default path for consumers is obvious from reading the prop contract

Verification:
- example app compiles with the new recommended API
- `pnpm --filter @mai/nuxt-app-example build`

### Task 5: Normalize emitted event contract
Keep current event semantics, but rationalize naming/documentation so consumers understand:
- user-selection events
- success events
- error events

Acceptance criteria:
- event categories are explicit and documented
- no duplicate or ambiguous consumer-facing event concepts remain

Verification:
- interactive tests still cover success and error flow
- `pnpm --filter @mai/mai-ui-vue test`

### Checkpoint: API
- package can be explained to a consumer in two usage modes:
  - low-level board
  - high-level interactive board

## Phase 3: Design-System Consolidation

### Task 6: Convert `theme.css` into a stable token layer
Normalize CSS variables into a design-token system aligned with `DESIGN.md`.

Token groups:
- typography
- surface/background
- card/elevation
- radius/spacing
- control states
- semantic feedback

Acceptance criteria:
- component styles use tokens instead of ad hoc literal values where practical
- typography hierarchy clearly follows `DESIGN.md`
- shadow/ring system is consistent across cards, popovers, toolbar controls, and inputs

Verification:
- visual scan of `theme.css` shows reduced one-off values
- `pnpm --filter @mai/mai-ui-vue build`

### Task 7: Run a UI consistency pass across all visible surfaces
Standardize:
- board header
- navigation controls
- metrics chips
- event cards
- draft/ghost cards
- action popovers
- form controls
- error/feedback text

Acceptance criteria:
- all visible surfaces feel like one product
- small-height event cards, draft cards, and action overlays share consistent spacing and alignment rules
- styling remains grayscale-first with subtle controlled accents per `DESIGN.md`

Verification:
- manual check in Nuxt example at desktop and mobile widths
- compare normal slot, appointment, draft slot, ghost drag state, and action card states

### Checkpoint: Visual System
- package styling is token-driven and visually cohesive

## Phase 4: Consumer Ergonomics

### Task 8: Make the example app the canonical integration path
Refactor the example app so it demonstrates the intended package usage with minimal glue.

Goals:
- reduce repetitive event-to-message mapping where possible
- keep refresh/mutate flow obvious
- show one recommended integration shape only

Acceptance criteria:
- example app is readable as package documentation by itself
- a new contributor can identify the minimum required setup quickly

Verification:
- `pnpm --filter @mai/nuxt-app-example build`

### Task 9: Improve docs for package consumption
Add or update package-level guidance to explain:
- when to use `MaiBoard`
- when to use `MaiBoardInteractive`
- how to style/import CSS
- what data/actions the consumer must provide

Acceptance criteria:
- package usage is documented in concise form
- docs do not require reading internal files to understand intended usage

Verification:
- docs and example app match each other

## Phase 5: Contract-Focused Testing

### Task 10: Add tests for public package contracts
Add or strengthen tests around:
- `MaiBoard` render/selection contract
- `MaiBoardInteractive` action and error contract
- slot drag/resize precision and minimum-span rules
- draft and overlay state transitions
- public export surface expectations

Acceptance criteria:
- tests protect consumer-visible behavior, not only helper implementation
- internal refactors can proceed with lower regression risk

Verification:
- `pnpm --filter @mai/mai-ui-vue test`

### Task 11: Add a package-level validation checkpoint
Validate the package as consumed from the workspace:
- `pnpm --filter @mai/mai-ui-vue build`
- `pnpm --filter @mai/mai-ui-vue test`
- `pnpm --filter @mai/nuxt-app-example build`
- `pnpm run test:boundary`

Acceptance criteria:
- package builds cleanly
- example app remains compatible
- boundary checks continue to pass

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| `MaiBoardInteractive` API simplification breaks current consumers | High | introduce compatibility props first, migrate example app, then narrow public docs |
| Visual polish creates inconsistent edge-case layouts | Medium | validate compact slot, ghost, draft, and overlay states explicitly |
| Internal layer refactor leaks new deep import paths | Medium | add barrels early and keep public exports fixed before moving consumers |
| Tests still overfit helpers instead of contracts | Medium | add component/behavior-level assertions before large cleanup phases |

## Suggested Commit Checkpoints
- `refactor: separate mai-ui-vue package layers`
- `refactor: simplify mai-board-interactive public api`
- `style: consolidate mai-ui-vue design tokens and surfaces`
- `docs: align mai-ui-vue usage docs with example app`
- `test: add contract coverage for mai-ui-vue consumers`

## Final Verification
- [ ] `MaiBoard` is the clean presentational entry point
- [ ] `MaiBoardInteractive` is the clear high-level entry point
- [ ] package exports are intentional and documented
- [ ] UI consistently follows `DESIGN.md`
- [ ] example app reflects the recommended consumer workflow
- [ ] build, tests, and boundary checks pass
