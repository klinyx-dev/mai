# Repository Guidelines

## Project Structure & Module Organization
This repository is currently spec-first. The source of truth lives in [`docs/functional_spec.md`](./docs/functional_spec.md) and [`docs/technical_spec.md`](./docs/technical_spec.md). 

Implementation is expected to start as a Rust crate with a layout close to `core/{domain,commands,validation,state,layout,application,adapters}`. 

Put architectural decisions and major changes under `docs/`, and keep agent workflow artifacts in `.agents/{rules,plans,memory}`.

## Build, Test, and Development Commands
Once the crate is scaffolded, standardize on Cargo:
- `cargo build` builds the scheduling core.
- `cargo test` runs unit, integration, and layout tests.
- `cargo fmt --all` formats Rust code.
- `cargo clippy --all-targets --all-features -D warnings` enforces lint cleanliness.

Until code exists, update the specs first, then implement against them.

## Coding Style & Naming Conventions
Use Rust-first design with explicit domain types and deterministic behavior. 

Prefer 4-space indentation, `snake_case` for modules/functions, `PascalCase` for structs/enums, and strongly typed IDs such as `SlotId` and `AppointmentId`. 

Keep the core headless: no DOM, CSS, pixel math, or framework-specific logic in domain or layout modules. Use `rustfmt` and Clippy as the baseline style gates.

## Testing Guidelines
Tests should mirror the technical spec: unit tests for invariants, service tests for command flows, and layout tests for week filtering and ordering. Name tests by behavior, for example `rejects_overlapping_slots_for_same_assignee`. Cover booking/unbooking transitions, overlap rejection, cancelled-slot behavior, and deterministic weekly layout output.

## Commit & Pull Request Guidelines
Git history currently uses short imperative subjects with optional prefixes such as `fix:` and `add:`. Keep commits focused and descriptive, for example `fix: reject booking cancelled slots`. PRs should link the relevant spec section, summarize behavioral changes, list validation/tests run, and include example payloads or screenshots when an adapter/UI is introduced.

## Agent-Specific Instructions
Read `.agents/rules/*.md` before editing code, docs, or commits. Load relevant skills from `.agents/skills/**/SKILL.md` or global agent skill directories when available, and mention applied skills explicitly as `Using skill: <skill-name>`. If a local rule conflicts with a skill, follow the local rule first.
