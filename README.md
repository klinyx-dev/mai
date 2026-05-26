# mai

Headless scheduling engine in Rust, with wasm output and a web workspace for app integration.

## What is in this repo
- `core/`: Rust scheduling core crate.
- `web/`: pnpm workspace for TypeScript contracts, wasm adapter, Vue UI, and Nuxt example app.
- `docs/README.md`: consolidated project documentation.

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
- Frontend adoption guidance: [docs/README.md](./docs/README.md)

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
- Consolidated project docs: [docs/README.md](./docs/README.md)
