# Web Week Calendar Navigation Status

## Completed
- Reworked `@mai/mai-ui-vue` `MaiBoard` into a week-calendar presentation with:
  - Week range label and navigation controls (`Prev`, `Today`, `Next`)
  - Timed day columns (08:00-20:00) with vertically positioned slot/appointment blocks
  - Loading badge and inline error display support
- Added `navigate-week` emit contract so host apps control week state and queries.
- Updated Nuxt example page to:
  - Keep a week `anchorDate` in state
  - Refresh weekly layout from adapter on initial load and on navigation
  - Bind loading/error/anchor props into `MaiBoard`
- Kept existing adapter/query contract unchanged (`weekly_layout` query with `anchor_date` and visible minutes).

## Verification
- `pnpm run build` (workspace web packages) passed.
- `pnpm --filter @mai/nuxt-app-example build` (Nuxt production build) passed.

