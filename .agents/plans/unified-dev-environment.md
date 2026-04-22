# Implementation Plan: Unified Dev Environment

## Overview
Make local development start with the fewest practical commands by using one containerized workflow for Rust, WASM packaging, web packages, and the Nuxt example app.

The target developer experience is:

Windows:

```powershell
.\scripts\dev.ps1 setup
.\scripts\dev.ps1 dev
.\scripts\dev.ps1 verify
```

macOS/Linux:

```bash
./scripts/dev.sh setup
./scripts/dev.sh dev
./scripts/dev.sh verify
```

The host scripts should start the full local experience without requiring Rust, Cargo, Node.js, pnpm, or wasm tooling on the host.

## Goals
- Keep host prerequisites minimal:
  - Podman only
- Move Rust, wasm-pack, Node.js, pnpm, and web package tooling into the dev image.
- Avoid forcing contributors to debug corporate TLS/certificate issues during local image builds.
- Provide one command for daily app startup.
- Provide one command for full validation.
- Preserve existing `cargo make` tasks as optional internal/advanced commands.

## Non-Goals
- No production deployment workflow.
- No CI redesign unless needed to reuse the same commands later.
- No release automation.
- No changes to scheduling core behavior.

## Target Commands

### One-time Setup
Windows:

```powershell
.\scripts\dev.ps1 setup
```

macOS/Linux:

```bash
./scripts/dev.sh setup
```

Expected behavior:
- prepares Podman machine when needed
- builds the local dev image from `Containerfile`
- installs web dependencies inside the container

### Daily Development
Windows:

```powershell
.\scripts\dev.ps1 dev
```

macOS/Linux:

```bash
./scripts/dev.sh dev
```

Expected behavior:
- ensures the dev image exists
- builds or refreshes `core/pkg`
- installs web dependencies if needed
- builds web packages
- starts Nuxt example app from inside the container
- exposes the app at `http://localhost:3000`

### Full Validation
Windows:

```powershell
.\scripts\dev.ps1 verify
```

macOS/Linux:

```bash
./scripts/dev.sh verify
```

Expected behavior:
- runs Rust format check
- runs Clippy
- runs Rust tests
- runs wasm target check
- runs generated package smoke
- runs web package build
- runs web tests

## Tasks

### Task 1: Add Host Script Entrypoints
Add:
- `scripts/dev.ps1` for Windows PowerShell
- `scripts/dev.sh` for macOS/Linux shells

Supported commands:
- `setup`
- `setup-no-tls-verify`
- `dev`
- `verify`
- `shell`
- `web-install`
- `web-build`
- `web-test`

Responsibilities:
- verify `podman` is available
- initialize/start Podman machine when needed
- build the dev image
- run commands inside the dev container with the correct mounts, cache volumes, workdir, and port mapping

Acceptance criteria:
- no host Rust/Cargo installation is required
- no host Node.js/pnpm installation is required
- Windows and macOS/Linux commands are symmetrical
- unknown commands print concise usage

### Task 2: Make Dev Image Self-Sufficient
Update `Containerfile` so the image contains:
- Rust toolchain
- `rustfmt`
- `clippy`
- `wasm32-unknown-unknown` target
- `wasm-pack`
- Node.js `22.x`
- `corepack`
- pnpm `10.x`

Acceptance criteria:
- No local Node.js installation is required for the normal containerized workflow.
- No local pnpm installation is required for the normal containerized workflow.
- `node --version` and `pnpm --version` work inside the dev container.

### Task 3: Keep Image Setup Simple and TLS-Aware
Keep `podman build` as the normal setup path, but make the documented fallback explicit and narrow for corporate TLS environments.

Default:
- `dev.ps1 setup` / `dev.sh setup` prepares Podman and builds the local image from `Containerfile`.

Fallback:
- if local image build fails because of corporate TLS interception, use `dev.ps1 setup-no-tls-verify` or `dev.sh setup-no-tls-verify`
- this fallback should only disable TLS verification for the base-image pull step
- all later package installation inside the image remains unchanged

Recommended implementation:
- host scripts call `podman build --tls-verify=true` by default
- `setup-no-tls-verify` calls `podman build --tls-verify=false`
- keep the fallback explicit rather than automatic

Acceptance criteria:
- default setup remains one straightforward local build path
- contributors have one documented fallback when Podman cannot pull `rust:bookworm` through company TLS
- no prebuilt-image registry, image tarball, or extra distribution workflow is required
- TLS bypass is limited to the development base-image pull path

### Task 4: Add Persistent Web Dependency Cache
Update host script container run configuration with pnpm cache settings:
- add `PNPM_STORE_VOL = "pnpm-store"`
- mount it into the container
- set `PNPM_HOME`
- set pnpm store path, for example `/pnpm/store`

Acceptance criteria:
- repeated `pnpm install` runs are faster after the first run
- cache volume is reused across script commands

### Task 5: Add Web Commands to Host Scripts
Add host script commands:
- `web-install`
- `web-build`
- `web-test`
- `web-dev`

Expected command behavior:
- `web-install`: runs `pnpm install --frozen-lockfile` from `web/`
- `web-build`: runs `pnpm run build` from `web/`
- `web-test`: runs `pnpm run test` from `web/`
- `web-dev`: runs Nuxt dev server with host binding suitable for container access

Acceptance criteria:
- web tasks run without host Node/pnpm
- Nuxt app is reachable from host browser

### Task 6: Add Unified Dev Command
Add `dev` command to both host scripts.

Recommended flow inside one container:

```bash
core/tests/run_generated_package_smoke.sh
cd web
pnpm install --frozen-lockfile
pnpm run build
pnpm --filter @mai/nuxt-app-example dev --host 0.0.0.0 --port 3000
```

Acceptance criteria:
- one command starts the local app stack
- generated WASM package exists before Nuxt starts
- port `3000` is exposed to host

### Task 7: Add Unified Verification Command
Add `verify` command to both host scripts.

Recommended flow inside one container:

```bash
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
cargo check --target wasm32-unknown-unknown -p mai
core/tests/run_generated_package_smoke.sh
cd web
pnpm install --frozen-lockfile
pnpm run build
pnpm run test
```

Acceptance criteria:
- one command validates Rust, WASM, and web behavior
- existing granular tasks remain available for focused debugging

### Task 8: Keep cargo-make Optional
Keep existing `Makefile.toml` tasks as optional advanced commands for contributors who already have Rust/Cargo locally.

Acceptance criteria:
- docs make host scripts the default path
- cargo-make remains available but is not required for normal development

### Task 9: Update Developer Documentation
Update `README-dev.md` to make the default path:

Windows:

```powershell
.\scripts\dev.ps1 setup
.\scripts\dev.ps1 dev
.\scripts\dev.ps1 verify
```

macOS/Linux:

```bash
./scripts/dev.sh setup
./scripts/dev.sh dev
./scripts/dev.sh verify
```

Document:
- required host tools
- first-run expectations
- app URL
- common port override
- corporate TLS fallback:
  - `.\scripts\dev.ps1 setup-no-tls-verify`
  - `./scripts/dev.sh setup-no-tls-verify`
- fallback granular commands

Acceptance criteria:
- contributors do not need to read separate Rust and web setup sections for normal development
- contributors do not need host Rust/Cargo for normal development
- host-side Node/pnpm requirements are clearly marked optional or removed from the default workflow

## Verification
- `.\scripts\dev.ps1 setup`
- `.\scripts\dev.ps1 setup-no-tls-verify`
- `.\scripts\dev.ps1 web-install`
- `.\scripts\dev.ps1 web-build`
- `.\scripts\dev.ps1 web-test`
- `.\scripts\dev.ps1 dev`
- `.\scripts\dev.ps1 verify`
- `./scripts/dev.sh setup`
- `./scripts/dev.sh setup-no-tls-verify`
- `./scripts/dev.sh web-install`
- `./scripts/dev.sh web-build`
- `./scripts/dev.sh web-test`
- `./scripts/dev.sh dev`
- `./scripts/dev.sh verify`

## Risks and Decisions
- Node.js installation should use a stable, explicit Node 22 source instead of distro-default Node if the distro package is too old.
- Local `podman build` from `rust:bookworm` can fail under corporate TLS interception because it performs registry, apt, rustup, and cargo network calls inside Podman.
- Keep TLS behavior secure by default.
- The fallback should be explicit, dev-only, and limited to Podman base-image acquisition.
- `dev` should run as a long-lived foreground command because Nuxt dev server owns the process.
- If port `3000` is occupied, add a documented override task or environment variable instead of requiring command editing.

## Commit Checkpoints
1. `chore: add podman host script entrypoints`
2. `chore: make dev container self-contained for Rust and web`
3. `chore: add simple podman TLS fallback for dev image build`
4. `chore: add containerized web commands and pnpm cache`
5. `chore: add unified dev and verify script commands`
6. `docs: simplify local dev workflow`
