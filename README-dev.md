# Dev Environment

## Requirements
- Podman
- cargo-make

The workflow is intended for both Windows and macOS. Run all commands from the repository root so the project directory is mounted into `/workspace` consistently.

## Install cargo-make
```bash
cargo install cargo-make
```

## First setup
```bash
cargo make prepare
cargo make build-image
```

`cargo make prepare` initializes and starts the Podman machine when needed. This matters on both macOS and Windows, where Podman runs through a VM.

## Daily commands
Open shell in container:
```bash
cargo make shell
```

Run checks:
```bash
cargo make ci
```

`cargo make ci` is the containerized equivalent of the canonical release-readiness verification sequence in `README.md`:
- `cargo fmt --all --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `cargo check --target wasm32-unknown-unknown -p mai`
- `core/tests/run_generated_package_smoke.sh`

## Notes
- Rust dependencies are cached in named Podman volumes, so rebuilds stay fast across container runs.
- Build artifacts are written to the container-mounted `target/` directory at `/workspace/target`.
