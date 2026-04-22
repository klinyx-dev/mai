<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import {
  MaiAppointmentActionsCard,
  MaiBoard,
  MaiSlotActionsCard,
  useMai,
} from "@mai/mai-ui-vue";
import { onMounted, ref, shallowRef } from "vue";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  EmptyCellClickEventPayload,
  SlotActionEventPayload,
  SlotClickEventPayload,
} from "@mai/mai-ui-vue";

type MaiLayout = ReturnType<typeof useMai>["layout"]["value"];

const layout = shallowRef<MaiLayout>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const interactionMessage = ref<string>("No UI interaction yet.");
const anchorDate = ref("2026-05-07");
const assigneeId = "doctor-42";
const selectedSlot = ref<SlotClickEventPayload | null>(null);
const selectedAppointment = ref<AppointmentClickEventPayload | null>(null);
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

function onSlotClick(payload: SlotClickEventPayload): void {
  selectedSlot.value = payload;
  selectedAppointment.value = null;
  interactionMessage.value = `slot-click: ${payload.slotId} (day ${payload.dayIndex}, ${payload.startMinute}-${payload.endMinute})`;
}

function onAppointmentClick(payload: AppointmentClickEventPayload): void {
  selectedAppointment.value = payload;
  selectedSlot.value = null;
  interactionMessage.value = `appointment-click: ${payload.appointmentId} on ${payload.slotId} (day ${payload.dayIndex})`;
}

function onEmptyCellClick(payload: EmptyCellClickEventPayload): void {
  interactionMessage.value = `empty-cell-click: day ${payload.dayIndex}, minute ${payload.minuteOfDay}`;
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
    selectedSlot.value = null;
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
    selectedSlot.value = null;
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
    selectedSlot.value = null;
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
    selectedAppointment.value = null;
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
        @navigate-week="navigateWeek"
        @slot-click="onSlotClick"
        @appointment-click="onAppointmentClick"
        @empty-cell-click="onEmptyCellClick"
      />
      <div style="display: grid; gap: 12px; padding: 12px 16px 20px">
        <MaiSlotActionsCard
          v-if="selectedSlot"
          :slot="selectedSlot"
          :busy="actionBusy"
          @book-slot="bookSlot"
          @cancel-slot="cancelSlot"
          @delete-slot="deleteSlot"
          @close="selectedSlot = null"
        />
        <MaiAppointmentActionsCard
          v-if="selectedAppointment"
          :appointment="selectedAppointment"
          :busy="actionBusy"
          @delete-appointment="deleteAppointment"
          @close="selectedAppointment = null"
        />
      </div>
    </ClientOnly>
  </main>
</template>
