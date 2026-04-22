# mai

Headless scheduling core in Rust with wasm + web integration.

## Repository structure
- `core/`: Rust scheduling core crate.
- `web/`: web workspace (`mai-web-core`, `mai-ui-vue`, Nuxt example app).
- `docs/`: functional/technical specs and adapter usage docs.

## Prerequisites
- Rust stable (`rustup`, `cargo`)
- Rust target `wasm32-unknown-unknown`
- `wasm-pack`
- Node.js 22.x
- `pnpm` 10.x

## Quick start (local)
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

## Validation commands
From repository root:

```bash
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
cargo check --target wasm32-unknown-unknown -p mai
core/tests/run_generated_package_smoke.sh
cd web && pnpm run build && pnpm run test
```

## Useful docs
- Dev setup details: [README-dev.md](/Users/minhduc/Documents/Projects/klinyx/mai/README-dev.md)
- Web workspace guide: [web/README.md](/Users/minhduc/Documents/Projects/klinyx/mai/web/README.md)
- Wasm adapter usage: [docs/wasm_adapter_usage.md](/Users/minhduc/Documents/Projects/klinyx/mai/docs/wasm_adapter_usage.md)
- Payload examples: [docs/adapter_payload_examples.md](/Users/minhduc/Documents/Projects/klinyx/mai/docs/adapter_payload_examples.md)
