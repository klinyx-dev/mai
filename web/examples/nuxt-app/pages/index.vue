<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import { MaiBoard, useMai } from "@mai/mai-ui-vue";
import { onMounted, ref, shallowRef } from "vue";

type MaiLayout = ReturnType<typeof useMai>["layout"]["value"];

const layout = shallowRef<MaiLayout>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const anchorDate = ref("2026-05-07");
const assigneeId = "doctor-42";

let mai: ReturnType<typeof useMai> | null = null;

function isoTodayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function refreshWeek(): Promise<void> {
  if (!mai) {
    return;
  }

  loading.value = true;
  await mai.refresh({
    anchor_date: anchorDate.value,
    assignee_id: assigneeId,
    visible_start_minute: 540,
    visible_end_minute: 1020,
  });
  layout.value = mai.layout.value;
  errorMessage.value = mai.error.value;
  loading.value = false;
}

async function navigateWeek(shift: -1 | 0 | 1): Promise<void> {
  if (shift === 0) {
    anchorDate.value = isoTodayUtc();
  } else {
    anchorDate.value = shiftIsoDate(anchorDate.value, shift * 7);
  }
  await refreshWeek();
}

onMounted(async () => {
  const { $mai } = useNuxtApp();
  mai = useMai({ adapter: $mai.adapter });
  await refreshWeek();
});
</script>

<template>
  <main style="background: #fff; padding: 24px; min-height: 100vh; box-sizing: border-box">
    <ClientOnly>
      <MaiBoard
        :layout="layout"
        :anchor-date="anchorDate"
        :is-loading="loading"
        :error-message="errorMessage"
        title="Doctor Availability Board"
        subtitle="Weekly schedule with appointment and availability timeline"
        @navigate-week="navigateWeek"
      />
    </ClientOnly>
  </main>
</template>
