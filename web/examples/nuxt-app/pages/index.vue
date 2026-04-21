<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import { MaiBoard, useMai } from "@mai/mai-ui-vue";

const { $mai } = useNuxtApp();
const mai = useMai({ adapter: $mai.adapter });

await mai.refresh({
  anchor_date: "2026-05-07",
  assignee_id: "doctor-42",
  visible_start_minute: 540,
  visible_end_minute: 1020,
});
</script>

<template>
  <MaiBoard :layout="mai.layout" title="Doctor Web Mai" />
</template>
