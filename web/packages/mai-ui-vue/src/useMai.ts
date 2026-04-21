import { ref } from "vue";
import {
  executeCommand,
  executeWeeklyLayoutQuery,
  type CommandEnvelope,
  type JsonAdapter,
  type WeeklyLayout,
  type WeeklyLayoutQueryPayload,
} from "@mai/mai-web-core";

export interface UseMaiOptions {
  adapter: JsonAdapter;
}

export function useMai(options: UseMaiOptions) {
  const layout = ref<WeeklyLayout | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function refresh(payload: WeeklyLayoutQueryPayload) {
    loading.value = true;
    error.value = null;
    try {
      const response = executeWeeklyLayoutQuery(options.adapter, payload);
      if (response.status === "error") {
        error.value = `${response.error.code}: ${response.error.message}`;
        return;
      }
      layout.value = response.data;
    } finally {
      loading.value = false;
    }
  }

  async function mutate<TPayload extends object>(command: CommandEnvelope<TPayload>) {
    const response = executeCommand(options.adapter, command);
    if (response.status === "error") {
      error.value = `${response.error.code}: ${response.error.message}`;
      return false;
    }
    return true;
  }

  return {
    layout,
    loading,
    error,
    refresh,
    mutate,
  };
}
