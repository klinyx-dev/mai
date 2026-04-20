#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
core_dir="$(cd "${script_dir}/.." && pwd)"

cd "${core_dir}"

wasm-pack build --target web --out-dir pkg --out-name mai

test -f "pkg/mai.js"
test -f "pkg/mai_bg.wasm"
test -f "pkg/mai.d.ts"
test -f "pkg/package.json"

node tests/generated_package_smoke.mjs
