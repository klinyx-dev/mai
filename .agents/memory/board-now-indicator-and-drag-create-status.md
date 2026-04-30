# Board now-indicator and drag-create status

Date: 2026-04-30

## Scope completed
- Added reusable now-indicator model helpers and week wrapper.
- Added reusable minute-tick state for now-indicator refresh with lifecycle cleanup and SSR guard.
- Rendered reusable now-indicator UI in week day columns.
- Added blank-grid pointer drag-to-create gesture with live draft preview.
- Wired drag-created range into interactive overlay and create-slot card defaults.
- Polished drag draft feedback style with active-drag visual state.

## Commits
- `2142af5` add: compute reusable now indicator position
- `c8df948` add: compute blank grid drag slot drafts
- `2344dc7` add: show reusable current time indicator on board
- `e901a62` fix: refresh board now indicator over time
- `e414905` add: drag blank board space to create slot draft
- `92248fe` fix: use dragged slot range in create overlay
- `06f5aac` polish: show drag create slot draft clearly

## Verification
- Repeatedly executed:
  - `pnpm --filter @mai/mai-ui-vue build`
  - `pnpm --filter @mai/mai-ui-vue test`
- Final state for this feature set: build passing, tests passing.
