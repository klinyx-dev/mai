import init, { WasmBindgenAdapter } from "../../../../core/pkg/mai.js";
import { createNuxtMaiState } from "@mai/mai-ui-vue";

export default defineNuxtPlugin(async () => {
  await init();
  const adapter = new WasmBindgenAdapter();

  return {
    provide: {
      mai: createNuxtMaiState(adapter),
    },
  };
});
