import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const distEntry = readFileSync(
  new URL("../dist/index.js", import.meta.url),
  "utf8"
);
const distTypes = readFileSync(
  new URL("../dist/index.d.ts", import.meta.url),
  "utf8"
);

test("exports only createWasmAdapter runtime entrypoint", () => {
  assert.match(distEntry, /export async function createWasmAdapter/);
  assert.doesNotMatch(distEntry, /export .*WasmBindgenAdapter/);
});

test("exports WasmAdapterFactoryOptions type", () => {
  assert.match(distTypes, /export interface WasmAdapterFactoryOptions/);
});

test("keeps default module path internal to this package", () => {
  assert.match(distEntry, /DEFAULT_WASM_MODULE_PATH/);
  assert.match(distEntry, /core\/pkg\/mai\.js/);
});
