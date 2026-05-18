# mai developer guide

Use this file for contributor workflow details. For project overview and first-run setup, start at [`README.md`](./README.md).

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

## Full local validation
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

## Notes
- wasm output is generated under `core/pkg/`.
- Nuxt example default URL: `http://localhost:3000/`.
- If port `3000` is busy:
  ```bash
  cd web
  pnpm --filter @mai/nuxt-app-example dev --host 127.0.0.1 --port 3101
  ```
