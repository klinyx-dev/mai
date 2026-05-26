# @mai/mai-wasm-adapter

Browser-side wasm loader for `mai` web consumers.

This package has one job: load the generated wasm module and return a `JsonAdapter` compatible with `@mai/mai-web-core`. App code should use this package instead of importing `core/pkg/*` directly.

```ts
import { createMaiClient } from "@mai/mai-web-core";
import { createWasmAdapter } from "@mai/mai-wasm-adapter";

const adapter = await createWasmAdapter();
const mai = createMaiClient(adapter);
```

For the full frontend-only adoption model, see `docs/README.md` from the repository root.
