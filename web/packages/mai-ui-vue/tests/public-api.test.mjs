import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const distTypes = readFileSync(
  new URL("../dist/index.d.ts", import.meta.url),
  "utf8"
);
const distEntry = readFileSync(
  new URL("../dist/index.js", import.meta.url),
  "utf8"
);
const distStyles = readFileSync(
  new URL("../dist/styles.css", import.meta.url),
  "utf8"
);

test("exports primary package entry points", () => {
  assert.match(distEntry, /export \{ MaiBoard \} from "\.\/MaiBoard";/);
  assert.match(
    distEntry,
    /export \{ MaiBoardInteractive \} from "\.\/MaiBoardInteractive";/
  );
  assert.match(distEntry, /export \{ useMai \} from "\.\/integration";/);
  assert.match(
    distEntry,
    /export \{ createNuxtMaiState \} from "\.\/integration";/
  );
  assert.match(
    distTypes,
    /export \{ useMai, type UseMaiOptions \} from "\.\/integration";/
  );
  assert.match(
    distTypes,
    /export \{ createNuxtMaiState, type NuxtMaiPluginState \} from "\.\/integration";/
  );
});

test("exports interactive constants", () => {
  assert.match(
    distEntry,
    /MAI_BOARD_INTERACTIVE_EVENTS/
  );
  assert.match(distTypes, /MaiBoardInteractiveEvent/);
  assert.match(
    distTypes,
    /MaiBoardInteractiveActionConfig/,
  );
  assert.match(
    distTypes,
    /MaiBoardInteractiveActorConfig/,
  );
  assert.match(
    distTypes,
    /MaiBoardInteractiveViewConfig/,
  );
});

test("publishes a flattened style entrypoint", () => {
  assert.match(distStyles, /fonts\.googleapis\.com/);
  assert.match(distStyles, /@layer mai\.tokens, mai\.base, mai\.components, mai\.responsive;/);
  assert.match(distStyles, /\.mai-board__/);
  assert.match(distStyles, /\.mai-action-/);
  assert.doesNotMatch(distStyles, /@import\s+["']\.\//);
});
