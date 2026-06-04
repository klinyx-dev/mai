import { ref } from "vue";
import {
  createMaiClient,
  type AnyCommandEnvelope,
  type JsonAdapter,
  type WeeklyLayout,
  type WeeklyLayoutQueryPayload,
} from "@mai/mai-web-core";

export interface UseMaiOptions {
  adapter: JsonAdapter;
}

export function useMai(options: UseMaiOptions) {
  const client = createMaiClient(options.adapter);
  const layout = ref<WeeklyLayout | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let refreshRequestId = 0;

  async function refresh(payload: WeeklyLayoutQueryPayload) {
    const requestId = ++refreshRequestId;
    loading.value = true;
    error.value = null;
    try {
      const response = client.queryWeeklyLayout(payload);
      if (requestId !== refreshRequestId) {
        return;
      }
      if (response.status === "error") {
        error.value = `${response.error.code}: ${response.error.message}`;
        return;
      }
      layout.value = response.data;
    } finally {
      if (requestId === refreshRequestId) {
        loading.value = false;
      }
    }
  }

  async function mutate(command: AnyCommandEnvelope) {
    const response = client.executeCommand(command);
    if (response.status === "error") {
      error.value = `${response.error.code}: ${response.error.message}`;
      return false;
    }
    error.value = null;
    return true;
  }

  async function mutateAndRefresh(
    command: AnyCommandEnvelope,
    payload: WeeklyLayoutQueryPayload
  ) {
    const ok = await mutate(command);
    if (!ok) {
      return false;
    }
    await refresh(payload);
    return true;
  }

  return {
    layout,
    loading,
    error,
    refresh,
    mutate,
    mutateAndRefresh,
  };
}
