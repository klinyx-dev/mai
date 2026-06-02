# mai

`mai` is a frontend-first appointment scheduling toolkit with a deterministic Rust core, a wasm JSON boundary, TypeScript web contracts, a wasm loader, Vue UI components, and a Nuxt example app.

The project is booking-first. Consuming apps keep ownership of auth, persistence, provider records, backend APIs, payments, notifications, deployment, and product-specific workflows.

## Repository

- `core/`: Rust scheduling crate and wasm-bindgen adapter.
- `web/packages/mai-web-core`: framework-agnostic TypeScript contracts and client helpers.
- `web/packages/mai-wasm-adapter`: browser wasm loader.
- `web/packages/mai-ui-vue`: Vue board, interactive board, booking flow, and styles.
- `web/examples/nuxt-app`: runnable Nuxt integration example.
- `SPEC.md`: technical source of truth.

## Requirements

- Rust stable
- Rust target `wasm32-unknown-unknown`
- `wasm-pack`
- Node.js 22.x
- `pnpm` 10.x

## Run Locally

```bash
rustup target add wasm32-unknown-unknown

cd core
wasm-pack build --target web --out-dir pkg --out-name mai
cd ..

cd web
pnpm install
pnpm run build
pnpm run example:dev
```

Open `http://localhost:3000/`.

If port `3000` is busy:

```bash
pnpm --filter @mai/nuxt-app-example dev --host 127.0.0.1 --port 3101
```

## Validate

From the repository root:

```bash
./scripts/verify-local.sh
```

Manual equivalent:

```bash
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
cargo check --target wasm32-unknown-unknown -p mai
core/tests/run_generated_package_smoke.sh
cd web && pnpm run build && pnpm run test
```

## Public Imports

App code should use package entrypoints only:

```ts
import { createMaiClient, type MaiCore } from "@mai/mai-web-core";
import { createWasmAdapter } from "@mai/mai-wasm-adapter";
import { MaiBookingFlow, type MaiBooking } from "@mai/mai-ui-vue";
import "@mai/mai-ui-vue/styles.css";
```

Do not import generated wasm files, `core/pkg/*`, package `src/*`, package `dist/*`, or feature-internal paths from app code.
