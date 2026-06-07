# Action Card Regression Fix

Fixed follow-up regressions in `@mai/mai-ui-vue` action cards.

- Appointment event pointer interactions now stop before reaching the day grid, preventing appointment clicks from opening the create-slot draft card.
- Action card consumers use JSX structure instead of nested `h(...)` render calls; `h` remains imported only for Vue's classic JSX runtime.
- Action card styles now use `var(--font-sans)` and inherit font styling for inputs and buttons.
- Added regression coverage for event drag eligibility and action-card font styling.
- Validation run: `pnpm -C web/packages/mai-ui-vue build` and `pnpm -C web/packages/mai-ui-vue test`.
