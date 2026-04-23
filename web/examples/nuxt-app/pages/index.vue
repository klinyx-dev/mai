<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import {
  INTERACTION_ACTIONS,
  INTERACTION_SUCCESS_EVENTS,
  MaiBoardInteractive,
  useMai,
} from "@mai/mai-ui-vue";
import type { AnyCommandEnvelope } from "@mai/mai-web-core";
import { onMounted, ref, shallowRef } from "vue";
import type {
  MaiAppointmentChangedEventPayload,
  MaiInteractionErrorPayload,
  MaiSlotCreatedEventPayload,
  SlotActionEventPayload,
} from "@mai/mai-ui-vue";

type MaiLayout = ReturnType<typeof useMai>["layout"]["value"];

const layout = shallowRef<MaiLayout>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const interactionMessage = ref<string>("No UI interaction yet.");
const anchorDate = ref("2026-05-07");
const assigneeId = "doctor-42";

let mai: ReturnType<typeof useMai> | null = null;
const SUCCESS_EVENT_TO_ACTION = {
  [INTERACTION_SUCCESS_EVENTS.SLOT_CREATED]: INTERACTION_ACTIONS.CREATE_SLOT,
  [INTERACTION_SUCCESS_EVENTS.SLOT_BOOKED]: INTERACTION_ACTIONS.BOOK_SLOT,
  [INTERACTION_SUCCESS_EVENTS.SLOT_CANCELLED]: INTERACTION_ACTIONS.CANCEL_SLOT,
  [INTERACTION_SUCCESS_EVENTS.SLOT_DELETED]: INTERACTION_ACTIONS.DELETE_SLOT,
  [INTERACTION_SUCCESS_EVENTS.APPOINTMENT_CANCELLED]:
    INTERACTION_ACTIONS.CANCEL_APPOINTMENT,
  [INTERACTION_SUCCESS_EVENTS.APPOINTMENT_DELETED]:
    INTERACTION_ACTIONS.DELETE_APPOINTMENT,
} as const;

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

async function mutateCommand(command: AnyCommandEnvelope): Promise<boolean> {
  if (!mai) return false;
  const ok = await mai.mutate(command);
  if (ok) {
    errorMessage.value = null;
  } else {
    errorMessage.value = mai.error.value;
  }
  return ok;
}

function setActionMessage(action: string, targetId: string): void {
  interactionMessage.value = `${action}: ${targetId}`;
}

function setSuccessMessage(
  eventName: keyof typeof SUCCESS_EVENT_TO_ACTION,
  targetId: string
): void {
  setActionMessage(SUCCESS_EVENT_TO_ACTION[eventName], targetId);
}

async function onSlotCreated(payload: MaiSlotCreatedEventPayload): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_CREATED, payload.slotId);
  await refreshWeek();
}

async function onSlotBooked(payload: SlotActionEventPayload): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_BOOKED, payload.slotId);
  await refreshWeek();
}

async function onSlotCancelled(payload: SlotActionEventPayload): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_CANCELLED, payload.slotId);
  await refreshWeek();
}

async function onSlotDeleted(payload: SlotActionEventPayload): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_DELETED, payload.slotId);
  await refreshWeek();
}

async function onAppointmentCancelled(
  payload: MaiAppointmentChangedEventPayload
): Promise<void> {
  setSuccessMessage(
    INTERACTION_SUCCESS_EVENTS.APPOINTMENT_CANCELLED,
    payload.appointmentId
  );
  await refreshWeek();
}

async function onAppointmentDeleted(
  payload: MaiAppointmentChangedEventPayload
): Promise<void> {
  setSuccessMessage(
    INTERACTION_SUCCESS_EVENTS.APPOINTMENT_DELETED,
    payload.appointmentId
  );
  await refreshWeek();
}

function onInteractionError(payload: MaiInteractionErrorPayload): void {
  errorMessage.value = `${payload.action}: ${payload.message}`;
  setActionMessage("interaction-error", payload.action);
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
      <MaiBoardInteractive
        :layout="layout"
        :anchor-date="anchorDate"
        :is-loading="loading"
        :error-message="errorMessage"
        title="Doctor Availability Board"
        subtitle="Weekly schedule with appointment and availability timeline"
        :assignee-id="assigneeId"
        created-by="ui-operator"
        :mutate-command="mutateCommand"
        :book-appointment-invitee-ids="['patient-demo']"
        book-appointment-title="Consultation"
        book-appointment-created-by="ui-operator"
        cancel-appointment-by="ui-operator"
        @navigate-week="navigateWeek"
        @slot-created="onSlotCreated"
        @slot-booked="onSlotBooked"
        @slot-cancelled="onSlotCancelled"
        @slot-deleted="onSlotDeleted"
        @appointment-cancelled="onAppointmentCancelled"
        @appointment-deleted="onAppointmentDeleted"
        @interaction-error="onInteractionError"
      />
    </ClientOnly>
  </main>
</template>
