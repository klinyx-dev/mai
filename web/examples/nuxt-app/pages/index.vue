<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import { MaiBoard, useMai } from "@mai/mai-ui-vue";
import { onMounted, ref, shallowRef } from "vue";
import type {
  AppointmentActionEventPayload,
  CreateSlotActionEventPayload,
  SlotActionEventPayload,
} from "@mai/mai-ui-vue";

type MaiLayout = ReturnType<typeof useMai>["layout"]["value"];

const layout = shallowRef<MaiLayout>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const interactionMessage = ref<string>("No UI interaction yet.");
const anchorDate = ref("2026-05-07");
const assigneeId = "doctor-42";
const actionBusy = ref(false);

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

async function bookSlot(payload: SlotActionEventPayload): Promise<void> {
  if (!mai) return;
  actionBusy.value = true;
  const ok = await mai.mutate({
    command: "add_appointment",
    payload: {
      appointment_id: `appt-${Date.now()}`,
      slot_id: payload.slotId,
      invitee_ids: ["patient-demo"],
      title: "Consultation",
      created_by: "ui-operator",
    },
  });
  if (ok) {
    interactionMessage.value = `book-slot: ${payload.slotId}`;
    await refreshWeek();
  } else {
    errorMessage.value = mai.error.value;
  }
  actionBusy.value = false;
}

async function createSlot(payload: CreateSlotActionEventPayload): Promise<void> {
  if (!mai) return;
  actionBusy.value = true;
  const ok = await mai.mutate({
    command: "add_slot",
    payload: {
      slot_id: payload.slotId,
      start: payload.startIso,
      end: payload.endIso,
      assignee_id: payload.assigneeId,
      created_by: payload.createdBy,
    },
  });
  if (ok) {
    interactionMessage.value = `create-slot: ${payload.slotId}`;
    await refreshWeek();
  } else {
    errorMessage.value = mai.error.value;
  }
  actionBusy.value = false;
}

async function cancelSlot(payload: SlotActionEventPayload): Promise<void> {
  if (!mai) return;
  actionBusy.value = true;
  const ok = await mai.mutate({
    command: "cancel_slot",
    payload: {
      slot_id: payload.slotId,
    },
  });
  if (ok) {
    interactionMessage.value = `cancel-slot: ${payload.slotId}`;
    await refreshWeek();
  } else {
    errorMessage.value = mai.error.value;
  }
  actionBusy.value = false;
}

async function deleteSlot(payload: SlotActionEventPayload): Promise<void> {
  if (!mai) return;
  actionBusy.value = true;
  const ok = await mai.mutate({
    command: "delete_slot",
    payload: {
      slot_id: payload.slotId,
    },
  });
  if (ok) {
    interactionMessage.value = `delete-slot: ${payload.slotId}`;
    await refreshWeek();
  } else {
    errorMessage.value = mai.error.value;
  }
  actionBusy.value = false;
}

async function deleteAppointment(
  payload: AppointmentActionEventPayload
): Promise<void> {
  if (!mai) return;
  actionBusy.value = true;
  const ok = await mai.mutate({
    command: "delete_appointment",
    payload: {
      appointment_id: payload.appointmentId,
    },
  });
  if (ok) {
    interactionMessage.value = `delete-appointment: ${payload.appointmentId}`;
    await refreshWeek();
  } else {
    errorMessage.value = mai.error.value;
  }
  actionBusy.value = false;
}

onMounted(async () => {
  const { $mai } = useNuxtApp();
  mai = useMai({ adapter: $mai.adapter });
  await refreshWeek();
});
</script>

<template>
  <main style="background: #fff; padding: 0; min-height: 100vh; box-sizing: border-box">
    <p style="margin: 0 0 12px; color: #5b6472; font: 500 13px/1.5 Inter, sans-serif">
      {{ interactionMessage }}
    </p>
    <ClientOnly>
      <MaiBoard
        :layout="layout"
        :anchor-date="anchorDate"
        :is-loading="loading"
        :error-message="errorMessage"
        title="Doctor Availability Board"
        subtitle="Weekly schedule with appointment and availability timeline"
        :action-busy="actionBusy"
        action-assignee-id="doctor-42"
        action-created-by="ui-operator"
        @navigate-week="navigateWeek"
        @create-slot="createSlot"
        @book-slot="bookSlot"
        @cancel-slot="cancelSlot"
        @delete-slot="deleteSlot"
        @delete-appointment="deleteAppointment"
      />
    </ClientOnly>
  </main>
</template>
