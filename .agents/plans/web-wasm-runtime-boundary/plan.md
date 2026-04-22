# Plan: Web WASM Runtime Boundary Hardening

## Objective
Make the Nuxt example consume `mai` through stable web packages only, with no direct `core/pkg` imports from app code.

Target layering:
- App (`examples/nuxt-app`) depends on package APIs.
- Runtime adapter package owns wasm-bindgen bootstrap details.
- `core/pkg` remains an implementation artifact behind package boundaries.

## Why this refactor
- Prevent generated wasm path coupling in app code.
- Keep app migration-safe when wasm output shape or location changes.
- Make package APIs closer to real production consumption.

## Scope
- In scope:
  - Add/extend package-level runtime adapter API for wasm bootstrap.
  - Refactor Nuxt example to consume package runtime API only.
  - Align docs/scripts/tests with new boundary.
- Out of scope:
  - Changing Rust domain logic.
  - Changing adapter response envelope shape.
  - Publishing to npm registry.

## Phase 1: Contract and package design
- Define package boundary contract for runtime bootstrap:
  - factory API (example: `createWasmAdapter()` / `initWasmAdapter()`),
  - initialization idempotency expectations,
  - input for wasm asset location if needed.
- Decide package ownership:
  - option A: extend `@mai/mai-web-core`,
  - option B (preferred): add `@mai/mai-wasm-adapter` package and keep `mai-web-core` runtime-agnostic.

Acceptance criteria:
- Contract is documented with minimal examples.
- Package responsibilities are explicit and non-overlapping.

Commit checkpoint:
- `spec: define web wasm runtime adapter package boundary`

## Phase 2: Implement runtime adapter package
- Create or update package to wrap `core/pkg`:
  - encapsulate `init` and `WasmBindgenAdapter` creation,
  - expose `JsonAdapter`-compatible instance to callers,
  - normalize adapter init error surface to stable JS errors.
- Keep exports minimal and explicit.

Acceptance criteria:
- No app code needs direct import from `core/pkg`.
- Runtime package compiles on Node/Nuxt dev flow.

Commit checkpoint:
- `feat: add wasm runtime adapter package for web consumers`

## Phase 3: Refactor Nuxt example to package-only usage
- Update Nuxt plugin/composables to import runtime adapter from package.
- Remove direct `../../../../core/pkg/...` imports from `examples/nuxt-app`.
- Ensure existing behavior stays unchanged.

Acceptance criteria:
- Nuxt example starts and renders with identical functional behavior.
- No direct `core/pkg` import remains in app source.

Commit checkpoint:
- `refactor: consume wasm adapter via web package in nuxt example`

## Phase 4: Build/test hardening for boundary regression
- Add tests for package client/runtime path where appropriate.
- Add a smoke check to fail if app imports `core/pkg` directly.
- Ensure workspace build order includes runtime package.

Acceptance criteria:
- `pnpm run build` succeeds from `web/`.
- `pnpm run example:dev` starts with package-only adapter path.
- Smoke check catches boundary regressions.

Commit checkpoint:
- `test: add boundary smoke checks for package-only wasm consumption`

## Phase 5: Docs and migration notes
- Update:
  - `web/README.md`,
  - technical docs section describing web adapter boundary,
  - any plan/memory artifacts impacted by the new boundary.
- Document recommended consumption path for real apps.

Acceptance criteria:
- Docs no longer suggest direct `core/pkg` imports from app code.
- Migration notes show old vs new import patterns.

Commit checkpoint:
- `docs: finalize package-first wasm consumption guidance`

## Verification checklist
- `pnpm install` (workspace root: `web/`)
- `pnpm run build` (workspace root: `web/`)
- `pnpm run test` (workspace root: `web/`)
- `pnpm --filter @mai/nuxt-app-example dev --host 127.0.0.1 --port 3000`
- Rust wasm build prerequisite remains:
  - `wasm-pack build --target web --out-dir pkg` in `core/`

## Risks and mitigations
- Risk: Nuxt/Vite cannot resolve wasm asset path after encapsulation.
  - Mitigation: keep explicit asset path config in package API and document Nuxt config expectation.
- Risk: package export maps drift from actual build output.
  - Mitigation: keep strict exports and add build-time smoke import check.
- Risk: accidental runtime concerns leak into `mai-web-core`.
  - Mitigation: preserve `mai-web-core` as runtime-agnostic contract/client module.
