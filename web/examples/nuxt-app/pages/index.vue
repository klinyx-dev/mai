<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import {
  INTERACTION_ACTIONS,
  INTERACTION_SUCCESS_EVENTS,
  MAI_BOARD_MODES,
  MaiBoardInteractive,
  MaiCalendarFilterToolbar,
  useMai,
  type MaiInteractive,
} from "@mai/mai-ui-vue";
import type { MaiCore } from "@mai/mai-web-core";
import { computed, onMounted, ref, shallowRef } from "vue";

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
const ownerOptions: MaiInteractive.CalendarFilterOwnerOption[] = ownerIds.map((ownerId) => ({
  id: ownerId,
  label: ownerLabels[ownerId],
}));
const selectedOwnerIds = ref<string[]>([ownerIds[0]]);
const operatorId = "operator-1";

function uniqueIds(ids: readonly string[]): string[] {
  return Array.from(new Set(ids));
}

function toOwnerFilter(ids: readonly string[]): MaiInteractive.ViewFilter {
  const normalizedIds = uniqueIds(ids);
  if (normalizedIds.length === 0) {
    return { mode: "none" };
  }
  return { mode: "owners", ids: normalizedIds };
}

const activeViewFilter = ref<MaiInteractive.ViewFilter>(toOwnerFilter(selectedOwnerIds.value));

let mai: ReturnType<typeof useMai> | null = null;
let seededDenseScenario = false;
const SUCCESS_EVENT_TO_ACTION = {
  [INTERACTION_SUCCESS_EVENTS.SLOT_CREATED]: INTERACTION_ACTIONS.CREATE_SLOT,
  [INTERACTION_SUCCESS_EVENTS.BLACKOUT_CREATED]: INTERACTION_ACTIONS.CREATE_BLACKOUT,
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

async function mutateCommand(command: MaiCore.AnyCommand): Promise<boolean> {
  if (!mai) return false;
  const ok = await mai.mutate(command);
  if (ok) {
    errorMessage.value = null;
  } else {
    errorMessage.value = mai.error.value;
  }
  return ok;
}

async function mutateCommandSoft(command: MaiCore.AnyCommand): Promise<void> {
  if (!mai) return;
  await mai.mutate(command);
}

async function seedDenseProviderScenario(): Promise<void> {
  if (!mai || seededDenseScenario) {
    return;
  }

  const commands: MaiCore.AnyCommand[] = [
    {
      command: "add_slot",
      payload: {
        slot_id: "demo-slot-capacity-42-a",
        start: "2026-05-04T09:00:00Z",
        end: "2026-05-04T09:30:00Z",
        resource_owner_id: "owner-42",
        created_by: operatorId,
        capacity: 2,
      },
    },
    {
      command: "add_slot",
      payload: {
        slot_id: "demo-slot-capacity-42-b",
        start: "2026-05-04T09:30:00Z",
        end: "2026-05-04T10:00:00Z",
        resource_owner_id: "owner-42",
        created_by: operatorId,
        capacity: 3,
      },
    },
    {
      command: "add_slot",
      payload: {
        slot_id: "demo-slot-dense-42-c",
        start: "2026-05-04T10:00:00Z",
        end: "2026-05-04T10:30:00Z",
        resource_owner_id: "owner-42",
        created_by: operatorId,
        capacity: 1,
      },
    },
    {
      command: "add_slot",
      payload: {
        slot_id: "demo-slot-dense-77-a",
        start: "2026-05-04T09:15:00Z",
        end: "2026-05-04T09:45:00Z",
        resource_owner_id: "owner-77",
        created_by: operatorId,
        capacity: 1,
      },
    },
    {
      command: "add_blackout_window",
      payload: {
        blackout_id: "demo-blackout-42-lunch",
        resource_owner_id: "owner-42",
        start: "2026-05-04T12:00:00Z",
        end: "2026-05-04T13:30:00Z",
        reason: "Lunch break",
        created_by: operatorId,
      },
    },
    {
      command: "add_blackout_window",
      payload: {
        blackout_id: "demo-blackout-77-rounds",
        resource_owner_id: "owner-77",
        start: "2026-05-04T09:00:00Z",
        end: "2026-05-04T10:00:00Z",
        reason: "Hospital rounds",
        created_by: operatorId,
      },
    },
  ];

  for (const command of commands) {
    await mutateCommandSoft(command);
  }

  seededDenseScenario = true;
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

async function onSlotCreated(payload: MaiInteractive.SlotCreatedPayload): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_CREATED, payload.slotId);
  await refreshWeek();
}

async function onBlackoutCreated(
  payload: MaiInteractive.BlackoutCreatedPayload
): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.BLACKOUT_CREATED, payload.blackoutId);
  await refreshWeek();
}

async function onSlotBooked(payload: MaiInteractive.SlotActionPayload): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_BOOKED, payload.slotId);
  await refreshWeek();
}

async function onSlotRescheduled(
  payload: MaiInteractive.SlotReschedulePayload
): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_RESCHEDULED, payload.slotId);
  await refreshWeek();
}

async function onSlotCancelled(payload: MaiInteractive.SlotActionPayload): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_CANCELLED, payload.slotId);
  await refreshWeek();
}

async function onSlotDeleted(payload: MaiInteractive.SlotActionPayload): Promise<void> {
  setSuccessMessage(INTERACTION_SUCCESS_EVENTS.SLOT_DELETED, payload.slotId);
  await refreshWeek();
}

async function onAppointmentCancelled(
  payload: MaiInteractive.AppointmentChangedPayload
): Promise<void> {
  setSuccessMessage(
    INTERACTION_SUCCESS_EVENTS.APPOINTMENT_CANCELLED,
    payload.appointmentId
  );
  await refreshWeek();
}

async function onAppointmentDeleted(
  payload: MaiInteractive.AppointmentChangedPayload
): Promise<void> {
  setSuccessMessage(
    INTERACTION_SUCCESS_EVENTS.APPOINTMENT_DELETED,
    payload.appointmentId
  );
  await refreshWeek();
}

function onInteractionError(payload: MaiInteractive.ErrorPayload): void {
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

async function onViewFilterChange(viewFilter: MaiInteractive.ViewFilter): Promise<void> {
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
  await seedDenseProviderScenario();
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
        @blackout-created="onBlackoutCreated"
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
