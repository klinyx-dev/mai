# Action Card Redesign

Completed the interactive-board action card redesign for `@mai/mai-ui-vue`.

- `MaiActionCard` now supports structured eyebrow, subtitle, body, detail-list, and action regions.
- Slot, appointment, and create-slot cards show readable day/time summaries and keep technical IDs as muted details.
- Action button tones use `MAI_ACTION_BUTTON_TONES`, and visible-action filtering is centralized.
- `action-overlay.css` was updated to follow the app design tokens for cards, inputs, buttons, focus states, and restrained operational styling.
- Validation run: `pnpm -C web/packages/mai-ui-vue build` and `pnpm -C web/packages/mai-ui-vue test`.
