# Compatibility Matrix

This matrix captures supported toolchain/runtime versions for `mai`.

## Core and Wasm Build

| Surface | Supported |
|---|---|
| Rust toolchain | stable |
| Cargo | bundled with Rust stable |
| Rust target | `wasm32-unknown-unknown` |
| wasm build tool | `wasm-pack` on PATH |

## Web Workspace

| Surface | Supported |
|---|---|
| Node.js | 22.x |
| pnpm | 10.x |
| Package manager | pnpm only for workspace scripts |

## Framework and Runtime Packages

| Package | Contract |
|---|---|
| `@mai/mai-web-core` | ESM import + `.d.ts` types |
| `@mai/mai-wasm-adapter` | ESM import + dynamic wasm module init |
| `@mai/mai-ui-vue` | Vue 3.5 peer dependency |
| Nuxt example | Nuxt 3 workspace example |

## Browser Support Targets (Near-Term)

| Browser Family | Target |
|---|---|
| Chromium-based | current stable |
| Firefox | current stable |
| Safari | current stable |

Notes:
- Legacy browsers are not targeted.
- support assumptions should be revisited before a `1.0.0` release.

## CI Alignment

Current CI/release checks should verify:
- rust format/lint/tests
- wasm target check
- generated package smoke
- web build/tests

See:
- `README.md`
- `docs/release_process.md`
