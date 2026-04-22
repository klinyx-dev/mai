import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { createWasmAdapter } from "../dist/index.js";

function fixtureUrl(fileName) {
  return pathToFileURL(path.resolve(process.cwd(), "tests", "fixtures", fileName))
    .href;
}

test("createWasmAdapter initializes wasm once and returns JsonAdapter instances", async () => {
  const moduleUrl = fixtureUrl("mock-wasm-module.mjs");
  const moduleRef = await import(moduleUrl);

  const adapter1 = await createWasmAdapter({ wasmModulePath: moduleUrl });
  const adapter2 = await createWasmAdapter({ wasmModulePath: moduleUrl });

  assert.equal(
    adapter1.execute_command_json("{}"),
    '{"status":"success","data":"applied"}'
  );
  assert.equal(
    adapter2.execute_query_json("{}"),
    '{"status":"success","data":{"week_start":"2026-01-05","week_end":"2026-01-12","slots":[],"appointments":[]}}'
  );
  assert.equal(moduleRef.getInitCount(), 1);
});

test("createWasmAdapter surfaces deterministic error for invalid wasm module shape", async () => {
  const moduleUrl = fixtureUrl("invalid-wasm-module.mjs");
  await assert.rejects(
    createWasmAdapter({ wasmModulePath: moduleUrl }),
    /missing WasmBindgenAdapter export/
  );
});
