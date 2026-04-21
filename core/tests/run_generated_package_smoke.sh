#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
core_dir="$(cd "${script_dir}/.." && pwd)"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  local cmd="$1"
  local install_hint="$2"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    fail "missing required command '${cmd}'. ${install_hint}"
  fi
}

require_wasm_target() {
  if ! rustup target list --installed | grep -Fxq "wasm32-unknown-unknown"; then
    fail "missing Rust target 'wasm32-unknown-unknown'. Run: rustup target add wasm32-unknown-unknown"
  fi
}

assert_file() {
  local file="$1"
  if [[ ! -f "${file}" ]]; then
    fail "expected generated file not found: ${file}"
  fi
}

cd "${core_dir}"

require_command "rustup" "Install rustup and ensure it is available on PATH."
require_command "wasm-pack" "Install wasm-pack with: cargo install wasm-pack"
require_command "node" "Install Node.js 22.x and ensure 'node' is available on PATH."
require_wasm_target

wasm-pack build --target web --out-dir pkg --out-name mai

assert_file "pkg/mai.js"
assert_file "pkg/mai_bg.wasm"
assert_file "pkg/mai.d.ts"
assert_file "pkg/package.json"

node tests/generated_package_smoke.mjs
