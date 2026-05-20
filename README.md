# mai

Headless scheduling engine in Rust, with wasm output and a web workspace for app integration.

## What is in this repo
- `core/`: Rust scheduling core crate.
- `web/`: pnpm workspace for TypeScript contracts, wasm adapter, Vue UI, and Nuxt example app.
- `docs/`: functional/technical specs and supporting docs.

## Quick start
Prerequisites:
- Rust stable (`rustup`, `cargo`)
- Rust target `wasm32-unknown-unknown`
- `wasm-pack`
- Node.js 22.x
- `pnpm` 10.x

From repository root:
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

## Web boundary rule
- App code must not import `core/pkg/*` directly.
- App code should use package exports from `web/packages/*` (for example `@mai/mai-wasm-adapter`).

## Main validation
From repository root:
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

## Developer docs
- Contributor workflow: [README-dev.md](./README-dev.md)
- Release process: [docs/release_process.md](./docs/release_process.md)
- Wasm adapter usage: [docs/wasm_adapter_usage.md](./docs/wasm_adapter_usage.md)
- Adapter error codes: [docs/adapter_error_codes.md](./docs/adapter_error_codes.md)
- Payload examples: [docs/adapter_payload_examples.md](./docs/adapter_payload_examples.md)
