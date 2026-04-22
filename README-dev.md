# Dev Environment

The default development workflow uses Podman host scripts. Rust, Cargo, wasm-pack, Node.js, and pnpm run inside the dev container.

## Requirements
- Podman

No host Rust/Cargo/Node.js/pnpm installation is required for the normal workflow.

Run all commands from the repository root.

## First Setup

Windows:

```powershell
.\scripts\dev.ps1 setup
```

macOS/Linux:

```bash
./scripts/dev.sh setup
```

This prepares Podman, builds the dev image, and installs web dependencies inside the container.

## Daily Development

Windows:

```powershell
.\scripts\dev.ps1 dev
```

macOS/Linux:

```bash
./scripts/dev.sh dev
```

The app is exposed at `http://localhost:3000`.

What `dev` does:
- builds or refreshes the generated WASM package
- installs web dependencies if needed
- builds web packages
- starts the Nuxt example app

## Full Validation

Windows:

```powershell
.\scripts\dev.ps1 verify
```

macOS/Linux:

```bash
./scripts/dev.sh verify
```

`verify` runs:
- `cargo fmt --all --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `cargo check --target wasm32-unknown-unknown -p mai`
- `core/tests/run_generated_package_smoke.sh`
- `pnpm run build`
- `pnpm run test`

## Useful Commands

Open a shell in the dev container:

```powershell
.\scripts\dev.ps1 shell
```

```bash
./scripts/dev.sh shell
```

Run web-only commands:

```powershell
.\scripts\dev.ps1 web-install
.\scripts\dev.ps1 web-build
.\scripts\dev.ps1 web-test
```

```bash
./scripts/dev.sh web-install
./scripts/dev.sh web-build
./scripts/dev.sh web-test
```

## Corporate TLS Fallback

If `setup` fails while Podman pulls the base image through company TLS interception, use the explicit dev-only fallback.

Windows:

```powershell
.\scripts\dev.ps1 setup-no-tls-verify
```

macOS/Linux:

```bash
./scripts/dev.sh setup-no-tls-verify
```

This disables Podman TLS verification for this dev image build only. Keep the normal `setup` command as the default.

## Notes
- Rust dependencies are cached in named Podman volumes.
- Web dependencies use a named pnpm store volume.
- Build artifacts are written to the mounted workspace `target/` directory.
- `cargo make` tasks may still exist for advanced/local Rust workflows, but they are not required for normal development.
