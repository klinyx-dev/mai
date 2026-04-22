import { createNuxtMaiState } from "@mai/mai-ui-vue";
import { createWasmAdapter } from "@mai/mai-wasm-adapter";

export default defineNuxtPlugin(async () => {
  const adapter = await createWasmAdapter();

  return {
    provide: {
      mai: createNuxtMaiState(adapter),
    },
  };
});
