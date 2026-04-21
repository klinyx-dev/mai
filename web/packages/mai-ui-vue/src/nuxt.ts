import type { JsonAdapter } from "@mai/mai-web-core";

export interface NuxtMaiPluginState {
  adapter: JsonAdapter;
}

export function createNuxtMaiState(adapter: JsonAdapter): NuxtMaiPluginState {
  return { adapter };
}
