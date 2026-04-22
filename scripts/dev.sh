#!/usr/bin/env bash
set -euo pipefail

command_name="${1:-help}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

image_name="mai"
workspace_dir="/workspace"
cargo_home="/usr/local/cargo"
cargo_registry_vol="cargo-registry"
cargo_git_vol="cargo-git"
target_vol="scheduler-target"
pnpm_store_vol="pnpm-store"
pnpm_store_dir="/pnpm/store"

usage() {
  cat <<'USAGE'
Usage: ./scripts/dev.sh <command>

Commands:
  setup               Prepare Podman and build the dev image
  setup-no-tls-verify Build the dev image with Podman TLS verification disabled for this dev build
  dev                 Build wasm/web packages and start the Nuxt example
  verify              Run Rust, WASM, and web validation
  shell               Open a shell in the dev container
  web-install         Install web dependencies
  web-build           Build web packages
  web-test            Run web tests
USAGE
}

require_podman() {
  command -v podman >/dev/null 2>&1 || {
    echo "ERROR: Podman is required. Install Podman and retry." >&2
    exit 1
  }
}

prepare_podman() {
  require_podman

  if [[ "$(uname -s)" == "Darwin" ]]; then
    podman machine inspect >/dev/null 2>&1 || podman machine init
    podman machine start >/dev/null 2>&1 || true
  fi
}

build_image() {
  local tls_verify="${1:-true}"
  prepare_podman
  podman build --tls-verify="${tls_verify}" -t "${image_name}" -f Containerfile "${repo_root}"
}

container_args=(
  run
  --rm
  -v "${repo_root}:${workspace_dir}"
  -v "${cargo_registry_vol}:${cargo_home}/registry"
  -v "${cargo_git_vol}:${cargo_home}/git"
  -v "${target_vol}:${workspace_dir}/target"
  -v "${pnpm_store_vol}:${pnpm_store_dir}"
  -e "CARGO_TARGET_DIR=${workspace_dir}/target"
  -e "PNPM_HOME=/pnpm"
  -e "PNPM_STORE_DIR=${pnpm_store_dir}"
  -w "${workspace_dir}"
)

run_container() {
  local script="$1"
  podman "${container_args[@]}" "${image_name}" bash -lc "${script}"
}

run_web_container() {
  local script="$1"
  podman "${container_args[@]}" -p 3000:3000 "${image_name}" bash -lc "${script}"
}

open_shell() {
  podman "${container_args[@]}" -it "${image_name}" bash
}

web_install() {
  run_container "cd web && pnpm install --frozen-lockfile"
}

web_build() {
  run_container "cd web && pnpm run build"
}

web_test() {
  run_container "cd web && pnpm run test"
}

dev() {
  run_web_container "core/tests/run_generated_package_smoke.sh
cd web
pnpm install --frozen-lockfile
pnpm run build
pnpm --filter @mai/nuxt-app-example dev --host 0.0.0.0 --port 3000"
}

verify() {
  run_container "cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
cargo check --target wasm32-unknown-unknown -p mai
core/tests/run_generated_package_smoke.sh
cd web
pnpm install --frozen-lockfile
pnpm run build
pnpm run test"
}

case "${command_name}" in
  setup)
    build_image true
    web_install
    ;;
  setup-no-tls-verify)
    build_image false
    web_install
    ;;
  dev)
    dev
    ;;
  verify)
    verify
    ;;
  shell)
    open_shell
    ;;
  web-install)
    web_install
    ;;
  web-build)
    web_build
    ;;
  web-test)
    web_test
    ;;
  help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
