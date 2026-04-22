import { createNuxtMaiState } from "@mai/mai-ui-vue";
import { createWasmAdapter } from "@mai/mai-wasm-adapter";

export default defineNuxtPlugin(async () => {
  const wasmModulePath = new URL("../../../../core/pkg/mai.js", import.meta.url)
    .href;
  const adapter = await createWasmAdapter({ wasmModulePath });

  return {
    provide: {
      mai: createNuxtMaiState(adapter),
    },
  };
});
