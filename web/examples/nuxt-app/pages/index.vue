<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import {
  INTERACTION_ACTIONS,
  INTERACTION_SUCCESS_EVENTS,
  MAI_BOARD_MODES,
  MaiBoardInteractive,
  MaiCalendarFilterToolbar,
  useMai,
} from "@mai/mai-ui-vue";
import type { AnyCommandEnvelope } from "@mai/mai-web-core";
import { computed, onMounted, ref, shallowRef } from "vue";
import type {
  MaiAppointmentChangedEventPayload,
  MaiInteractionErrorPayload,
  MaiSlotCreatedEventPayload,
  MaiViewFilter,
  MaiCalendarFilterOwnerOption,
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
const ownerOptions: MaiCalendarFilterOwnerOption[] = ownerIds.map((ownerId) => ({
  id: ownerId,
  label: ownerLabels[ownerId],
}));
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

onMounted(async () => {
  const { $mai } = useNuxtApp();
  mai = useMai({ adapter: $mai.adapter });
  await refreshWeek();
});
</script>

<template>
  <main class="mai-example-page">
    <p class="mai-example-feedback">
      {{ interactionMessage }}
    </p>
    <MaiCalendarFilterToolbar
      label="Resource Owners"
      :value="activeViewFilter"
      :owner-options="ownerOptions"
      @change="onViewFilterChange"
    />
    <ClientOnly>
      <MaiBoardInteractive
        :layout="layout"
        :anchor-date="anchorDate"
        :mode="MAI_BOARD_MODES.PROVIDER_ADMIN"
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

<style scoped>
.mai-example-page {
  background: var(--color-bg);
  padding: 0;
  min-height: 100vh;
  box-sizing: border-box;
}

.mai-example-feedback {
  margin: 0 0 var(--space-3);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
}
</style>
