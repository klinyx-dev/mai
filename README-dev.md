# Dev Setup (Local)

## Prerequisites
- Rust stable (`rustup`, `cargo`)
- Rust target `wasm32-unknown-unknown`
- `wasm-pack`
- Node.js 22.x
- `pnpm` 10.x

## One-time setup
```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

## Daily workflow
From repository root:

```bash
cd core
wasm-pack build --target web --out-dir pkg --out-name mai
cd ..
cd web
pnpm install
pnpm run build
pnpm run example:dev
```

## Full validation
From repository root:

```bash
./scripts/verify-local.sh
```

Equivalent manual sequence:

```bash
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
cargo check --target wasm32-unknown-unknown -p mai
core/tests/run_generated_package_smoke.sh
cd web && pnpm run build && pnpm run test
```

## Quick notes
- WASM package output is generated under `core/pkg/`.
- Manual wasm package build command:

```bash
cd core
wasm-pack build --target web --out-dir pkg --out-name mai
```

- Nuxt example runs at `http://localhost:3000/` by default.
- If port `3000` is busy:

```bash
cd web
pnpm --filter @mai/nuxt-app-example dev --host 127.0.0.1 --port 3101
```
