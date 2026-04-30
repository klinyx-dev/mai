<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import {
  INTERACTION_ACTIONS,
  INTERACTION_SUCCESS_EVENTS,
  MaiBoardInteractive,
  useMai,
} from "@mai/mai-ui-vue";
import type { AnyCommandEnvelope } from "@mai/mai-web-core";
import { computed, onMounted, ref, shallowRef } from "vue";
import type {
  MaiAppointmentChangedEventPayload,
  MaiInteractionErrorPayload,
  MaiSlotCreatedEventPayload,
  MaiViewFilter,
  MaiSlotRescheduledEventPayload,
  SlotActionEventPayload,
} from "@mai/mai-ui-vue";

type MaiLayout = ReturnType<typeof useMai>["layout"]["value"];

const layout = shallowRef<MaiLayout>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const interactionMessage = ref<string>("No UI interaction yet.");
const anchorDate = ref("2026-05-07");
const ownerIds = ["owner-42", "owner-77", "owner-90"] as const;
const ownerLabels: Record<(typeof ownerIds)[number], string> = {
  "owner-42": "Dr Martin",
  "owner-77": "Dr Bernard",
  "owner-90": "Dr Dupont",
};
const selectedOwnerIds = ref<string[]>([ownerIds[0]]);
const operatorId = "operator-1";

function uniqueIds(ids: readonly string[]): string[] {
  return Array.from(new Set(ids));
}

function toOwnerFilter(ids: readonly string[]): MaiViewFilter {
  const normalizedIds = uniqueIds(ids);
  if (normalizedIds.length === 0) {
    return { mode: "none" };
  }
  return { mode: "owners", ids: normalizedIds };
}

const activeViewFilter = ref<MaiViewFilter>(toOwnerFilter(selectedOwnerIds.value));

let mai: ReturnType<typeof useMai> | null = null;
const SUCCESS_EVENT_TO_ACTION = {
  [INTERACTION_SUCCESS_EVENTS.SLOT_CREATED]: INTERACTION_ACTIONS.CREATE_SLOT,
  [INTERACTION_SUCCESS_EVENTS.SLOT_RESCHEDULED]: INTERACTION_ACTIONS.RESCHEDULE_SLOT,
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
    view_filter: activeViewFilter.value,
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

async function onSlotRescheduled(
  payload: MaiSlotRescheduledEventPayload
): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_RESCHEDULED, payload.slotId);
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

const boardView = {
  title: "mai",
  subtitle: "Weekly schedule with appointment and availability timeline",
} as const;

const boardActor = computed(() => ({
  resourceOwnerId: ownerIds[0],
  createdBy: operatorId,
  bookAppointmentInviteeIds: ["participant-7"],
  bookAppointmentTitle: "Planning session",
  bookAppointmentCreatedBy: operatorId,
  cancelAppointmentBy: operatorId,
}));

const boardActions = {
  mutateCommand,
} as const;

async function onViewFilterChange(viewFilter: MaiViewFilter): Promise<void> {
  activeViewFilter.value = viewFilter;
  interactionMessage.value = `view-filter-change: ${viewFilter.mode}`;
  selectedOwnerIds.value =
    viewFilter.mode === "owners" || viewFilter.mode === "group"
      ? uniqueIds(viewFilter.ids)
      : [];
  await refreshWeek();
}

async function showAllCalendars(): Promise<void> {
  selectedOwnerIds.value = [];
  await onViewFilterChange({ mode: "all" });
}

async function showNoCalendars(): Promise<void> {
  selectedOwnerIds.value = [];
  await onViewFilterChange({ mode: "none" });
}

function isOwnerSelected(ownerId: string): boolean {
  return selectedOwnerIds.value.includes(ownerId);
}

async function toggleOwner(ownerId: string): Promise<void> {
  const nextSelected = isOwnerSelected(ownerId)
    ? selectedOwnerIds.value.filter((id) => id !== ownerId)
    : [...selectedOwnerIds.value, ownerId];
  selectedOwnerIds.value = uniqueIds(nextSelected);
  await onViewFilterChange(toOwnerFilter(selectedOwnerIds.value));
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
    <div style="display: flex; gap: 8px; margin: 0 0 12px">
      <button
        type="button"
        :style="{
          border: activeViewFilter.mode === 'all' ? '1px solid #111827' : '1px solid #d1d5db',
          background: activeViewFilter.mode === 'all' ? '#111827' : '#ffffff',
          color: activeViewFilter.mode === 'all' ? '#ffffff' : '#111827',
          borderRadius: '999px',
          padding: '6px 12px',
          font: '500 13px/1.2 Inter, sans-serif',
          cursor: 'pointer'
        }"
        @click="showAllCalendars"
      >
        All calendars
      </button>
      <button
        type="button"
        :style="{
          border: activeViewFilter.mode === 'none' ? '1px solid #111827' : '1px solid #d1d5db',
          background: activeViewFilter.mode === 'none' ? '#111827' : '#ffffff',
          color: activeViewFilter.mode === 'none' ? '#ffffff' : '#111827',
          borderRadius: '999px',
          padding: '6px 12px',
          font: '500 13px/1.2 Inter, sans-serif',
          cursor: 'pointer'
        }"
        @click="showNoCalendars"
      >
        No calendars
      </button>
    </div>
    <fieldset
      style="margin: 0 0 12px; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px"
    >
      <legend style="padding: 0 4px; font: 500 12px/1.2 Inter, sans-serif; color: #4b5563">
        Resource owners
      </legend>
      <label
        v-for="ownerId in ownerIds"
        :key="ownerId"
        style="display: flex; align-items: center; gap: 8px; margin: 6px 0; font: 500 13px/1.4 Inter, sans-serif; color: #111827; cursor: pointer"
      >
        <input
          type="checkbox"
          :checked="isOwnerSelected(ownerId)"
          @change="toggleOwner(ownerId)"
        />
        <span>{{ ownerLabels[ownerId] }}</span>
      </label>
    </fieldset>
    <ClientOnly>
      <MaiBoardInteractive
        :layout="layout"
        :anchor-date="anchorDate"
        :is-loading="loading"
        :error-message="errorMessage"
        :view="boardView"
        :actor="boardActor"
        :view-filter="activeViewFilter"
        :actions="boardActions"
        @navigate-week="navigateWeek"
        @slot-created="onSlotCreated"
        @slot-rescheduled="onSlotRescheduled"
        @slot-booked="onSlotBooked"
        @slot-cancelled="onSlotCancelled"
        @slot-deleted="onSlotDeleted"
        @appointment-cancelled="onAppointmentCancelled"
        @appointment-deleted="onAppointmentDeleted"
        @view-filter-change="onViewFilterChange"
        @interaction-error="onInteractionError"
      />
    </ClientOnly>
  </main>
</template>
