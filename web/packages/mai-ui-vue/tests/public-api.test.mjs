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
const distPublicTypes = readFileSync(
  new URL("../dist/public-types.d.ts", import.meta.url),
  "utf8"
);
const distUseMaiTypes = readFileSync(
  new URL("../dist/useMai.d.ts", import.meta.url),
  "utf8"
);

test("exports primary package entry points", () => {
  assert.match(distEntry, /export \{ MaiBoard \} from "\.\/features\/board";/);
  assert.match(
    distEntry,
    /export \{ MaiBoardInteractive \} from "\.\/features\/interactive-board";/
  );
  assert.match(
    distEntry,
    /export \{ MaiCalendarFilterToolbar \} from "\.\/features\/calendar-filter";/
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
  assert.match(distUseMaiTypes, /mutateAndRefresh/);
  assert.match(
    distTypes,
    /export \{ createNuxtMaiState, type NuxtMaiPluginState \} from "\.\/integration";/
  );
  assert.match(
    distTypes,
    /export type \{ MaiBooking, MaiInteractive \} from "\.\/public-types";/
  );
  assert.doesNotMatch(distEntry, /core\/pkg/i);
  assert.doesNotMatch(distEntry, /WasmBindgenAdapter/i);
});

test("exports interactive constants", () => {
  assert.match(
    distEntry,
    /MAI_BOARD_INTERACTIVE_EVENTS/
  );
  assert.match(
    distEntry,
    /MAI_BOARD_MODES/
  );
  assert.match(
    distEntry,
    /MAI_BOOKING_FLOW_EVENTS/
  );
  assert.match(distPublicTypes, /namespace MaiInteractive/);
  assert.match(distPublicTypes, /type ActionConfig = MaiBoardInteractiveActionConfig/);
  assert.match(distPublicTypes, /type ActorConfig = MaiBoardInteractiveActorConfig/);
  assert.match(distPublicTypes, /type ViewConfig = MaiBoardInteractiveViewConfig/);
  assert.match(distPublicTypes, /type Mode = MaiBoardMode/);
  assert.match(distPublicTypes, /type CalendarFilterOwnerOption = MaiCalendarFilterOwnerOption/);
  assert.doesNotMatch(distTypes, /export type \{[^}]*MaiBoardInteractiveEvent/s);
  assert.doesNotMatch(distTypes, /export type \{[^}]*MaiBookingFlowEvent/s);
});

test("publishes a flattened style entrypoint", () => {
  assert.match(distStyles, /fonts\.googleapis\.com/);
  assert.match(distStyles, /@layer mai\.tokens, mai\.base, mai\.components, mai\.responsive;/);
  assert.match(distStyles, /\.mai-board__/);
  assert.match(distStyles, /\.mai-action-/);
  assert.match(distStyles, /--duration-fast:\s*120ms/);
  assert.doesNotMatch(distStyles, /@import\s+["']\.\//);
});

test("compiled styles preserve restrained scheduler design rules", () => {
  assert.match(
    distStyles,
    /\.mai-board__now-indicator\s*\{[^}]*border-top:\s*1px solid var\(--color-text-strong\)/s
  );
  assert.match(distStyles, /\.mai-board__event--slot/);
  assert.match(distStyles, /\.mai-board__event--appointment/);
  assert.match(distStyles, /\.mai-board__event-inline-main/);
  assert.match(
    distStyles,
    /\.mai-filter-toolbar\s*\{[^}]*display:\s*inline-flex;[^}]*width:\s*fit-content;/s
  );
  assert.match(
    distStyles,
    /\.mai-filter-toolbar__dropdown-panel\s*\{[^}]*width:\s*220px;/s
  );
  assert.doesNotMatch(distStyles, /#dc2626/i);
  assert.doesNotMatch(distStyles, /drop-shadow/i);
  assert.doesNotMatch(distStyles, /translateY\(-1px\)/);
  assert.doesNotMatch(distStyles, /text-transform:\s*uppercase/i);
});
