# Implementation Plan: TM13 Typed Web Command Contract Hardening

## Overview
Strengthen the web runtime boundary so command names and payload shapes are validated at compile time, reducing stringly-typed drift between app code and WASM adapter contracts.

## Why this is the next logical step
- Core command set is growing (`cancel_appointment` added), which increases payload mismatch risk.
- `@mai/mai-web-core` now has centralized command/query constants, but payload typing is still generic and permissive.
- Tightening this layer improves robustness for UI/example apps without changing core domain behavior.

## Scope
- In scope: `@mai/mai-web-core` typed command payload maps, typed envelope builders, adapter helper typing, consumer migration in example app and UI runtime helpers, tests/docs updates.
- Out of scope: domain/business rule changes, transport/protocol shape changes, auth/ACL model changes.

## Tasks

### Task 1: Define command payload map and typed envelopes
- Add explicit payload interfaces for each command (`add_slot`, `delete_slot`, `cancel_slot`, `add_appointment`, `cancel_appointment`, `delete_appointment`).
- Introduce `CommandPayloadMap` + generic `CommandEnvelopeByName<TCommand>`.
- Keep runtime JSON shape exactly unchanged.

Acceptance criteria:
- Invalid payload for a command fails TypeScript compile checks.
- Existing response envelope contracts remain unchanged.

### Task 2: Add typed command/query helper APIs
- Update `createCommandEnvelope` and `executeCommand` to infer payload by command constant.
- Keep `createQueryEnvelope`/`executeWeeklyLayoutQuery` aligned with the existing query contract.
- Preserve backward compatibility where practical via overloads or migration-safe wrappers.

Acceptance criteria:
- `executeCommand(adapter, createCommandEnvelope(COMMANDS.ADD_SLOT, ...))` is fully typed.
- No breaking runtime behavior.

### Task 3: Migrate consumers to typed helpers
- Update Nuxt example mutation calls to use command constants + typed envelope builders.
- Update `mai-ui-vue` integration points (if needed) to consume typed helper utilities instead of raw string command literals.

Acceptance criteria:
- No direct raw command string literals remain in app-facing mutation paths where helpers are available.
- Example app builds and runs with unchanged behavior.

### Task 4: Tests and docs
- Add/expand tests in `@mai/mai-web-core` for typed helper contract usage and envelope creation.
- Update docs with a “recommended command execution pattern” section using constants/builders.

Acceptance criteria:
- `pnpm --filter @mai/mai-web-core build`
- `pnpm --filter @mai/mai-web-core test`
- `pnpm --filter @mai/mai-ui-vue test`
- `pnpm run test` (workspace)

## Commit checkpoints
1. `spec: define typed web command payload map and envelope strategy`
2. `feat(web-core): enforce typed command envelope creation and execution`
3. `refactor(web): migrate app/ui consumers to typed command helpers`
4. `test+docs: cover typed command contract and usage guidance`
