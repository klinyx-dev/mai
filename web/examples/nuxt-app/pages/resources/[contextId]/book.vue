<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import {
  MaiBookingFlow,
  useMai,
  type MaiBooking,
} from "@mai/mai-ui-vue";
import {
  COMMANDS,
  createBookSlotCommand,
  createCommandEnvelope,
  type MaiCore,
} from "@mai/mai-web-core";
import { computed, onMounted, ref, shallowRef } from "vue";

const route = useRoute();
const contextId = computed(() => String(route.params.contextId ?? "workspace-demo"));
const anchorDate = ref("2026-05-07");
const layout = shallowRef<MaiCore.WeeklyLayout | null>(null);
const statusMessage = ref("Choose a category to begin.");
const bookingError = ref<string | null>(null);
const signedInUser = ref<{ inviteeId: string; userDisplayName: string } | null>(
  null
);
const context = computed<MaiBooking.Context>(() => ({
  contextId: contextId.value,
  label: "Resource workspace",
}));

let mai: ReturnType<typeof useMai> | null = null;
let appointmentCounter = 1;
const seeded = ref(false);

const categories: MaiBooking.Category[] = [
  {
    categoryId: "category-a",
    label: "Category A",
    description: "Standard 30 minute session",
  },
  {
    categoryId: "category-b",
    label: "Category B",
    description: "Focused consultation",
  },
];

const locations: MaiBooking.Location[] = [
  {
    locationId: "location-main",
    label: "Main clinic",
    description: "In-person appointments",
  },
  {
    locationId: "location-virtual",
    label: "Video consultation",
    description: "Remote appointments",
  },
];

const resources: MaiBooking.Resource[] = [
  {
    resourceId: "resource-1",
    label: "Resource One",
    categoryIds: ["category-a"],
    resourceOwnerId: "owner-1",
  },
  {
    resourceId: "resource-2",
    label: "Resource Two",
    categoryIds: ["category-a"],
    resourceOwnerId: "owner-2",
  },
  {
    resourceId: "resource-3",
    label: "Resource Three",
    categoryIds: ["category-b"],
    resourceOwnerId: "owner-3",
  },
];

const slotOwners: Record<string, MaiBooking.SlotOwner> = {
  "slot-resource-1": {
    resourceOwnerId: "owner-1",
    resourceId: "resource-1",
    resourceLabel: "Resource One",
  },
  "slot-resource-2": {
    resourceOwnerId: "owner-2",
    resourceId: "resource-2",
    resourceLabel: "Resource Two",
  },
  "slot-resource-3": {
    resourceOwnerId: "owner-3",
    resourceId: "resource-3",
    resourceLabel: "Resource Three",
  },
};

const bookingActor = computed<MaiBooking.ActorConfig>(() => ({
  inviteeId: signedInUser.value?.inviteeId,
  userDisplayName: signedInUser.value?.userDisplayName,
  createdBy: signedInUser.value?.inviteeId,
}));

function nextAppointmentId(): string {
  const id = `workspace-demo-appointment-${appointmentCounter}`;
  appointmentCounter += 1;
  return id;
}

async function seedResourceSlots(): Promise<void> {
  if (!mai || seeded.value) {
    return;
  }

  const seedCommands = [
    createCommandEnvelope(COMMANDS.ADD_SLOT, {
      slot_id: "slot-resource-1",
      start: "2026-05-05T09:00:00Z",
      end: "2026-05-05T09:30:00Z",
      resource_owner_id: "owner-1",
      created_by: "operator-1",
    }),
    createCommandEnvelope(COMMANDS.ADD_SLOT, {
      slot_id: "slot-resource-2",
      start: "2026-05-06T10:00:00Z",
      end: "2026-05-06T10:30:00Z",
      resource_owner_id: "owner-2",
      created_by: "operator-1",
    }),
    createCommandEnvelope(COMMANDS.ADD_SLOT, {
      slot_id: "slot-resource-3",
      start: "2026-05-07T11:00:00Z",
      end: "2026-05-07T11:30:00Z",
      resource_owner_id: "owner-3",
      created_by: "operator-1",
    }),
  ];

  for (const command of seedCommands) {
    await mai.mutate(command);
  }
  seeded.value = true;
}

async function queryLayout(
  payload: MaiCore.WeeklyLayoutQueryPayload
): Promise<MaiCore.WeeklyLayout> {
  if (!mai) {
    throw new Error("mai adapter is not ready");
  }

  await mai.refresh(payload);
  if (mai.error.value) {
    throw new Error(mai.error.value);
  }
  layout.value = mai.layout.value;
  if (!layout.value) {
    throw new Error("layout query returned no data");
  }
  return layout.value;
}

async function bookSlot(payload: MaiBooking.BookSlotPayload): Promise<void> {
  if (!mai) {
    throw new Error("mai adapter is not ready");
  }

  const ok = await mai.mutate(createBookSlotCommand(payload));
  if (!ok) {
    throw new Error(mai.error.value ?? "booking failed");
  }
  statusMessage.value = `Booked ${payload.title}`;
}

async function requestAuth(): Promise<{
  inviteeId: string;
  userDisplayName: string;
}> {
  signedInUser.value = {
    inviteeId: "participant-demo",
    userDisplayName: "Alex Martin",
  };
  statusMessage.value = "Signed in as Alex Martin.";
  return signedInUser.value;
}

async function onBookingConfirmed(payload: MaiBooking.BookSlotPayload): Promise<void> {
  bookingError.value = null;
  statusMessage.value = `Confirmed: ${payload.title}`;
}

function onBookingError(payload: { action: string; message: string }): void {
  bookingError.value = `${payload.action}: ${payload.message}`;
}

function onAvailabilityRefreshed(): void {
  statusMessage.value = "Availability refreshed after booking.";
}

onMounted(async () => {
  const { $mai } = useNuxtApp();
  mai = useMai({ adapter: $mai.adapter });
  await seedResourceSlots();
  await queryLayout({ anchor_date: anchorDate.value });
});
</script>

<template>
  <main class="resource-booking-page">
    <section class="resource-booking-header">
      <p class="resource-booking-kicker">Resource booking</p>
      <h1 class="resource-booking-title">Book a time</h1>
      <p class="resource-booking-subtitle">
        Choose a category, optionally choose a resource, then confirm with your account.
      </p>
      <p class="resource-booking-status">{{ statusMessage }}</p>
      <p v-if="bookingError" class="resource-booking-error">{{ bookingError }}</p>
    </section>
    <ClientOnly>
      <MaiBookingFlow
        :context="context"
        :locations="locations"
        :categories="categories"
        :resources="resources"
        :layout="layout"
        :slot-owners="slotOwners"
        :view="{ anchorDate, visibleStartMinute: 480, visibleEndMinute: 1080 }"
        :actor="bookingActor"
        :booking="{ createAppointmentId: nextAppointmentId }"
        :actions="{ queryLayout, bookSlot, requestAuth }"
        @booking-confirmed="onBookingConfirmed"
        @availability-refreshed="onAvailabilityRefreshed"
        @booking-error="onBookingError"
      />
    </ClientOnly>
  </main>
</template>

<style scoped>
.resource-booking-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 32px;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.resource-booking-header {
  display: grid;
  gap: 8px;
  max-width: 760px;
  margin: 0 0 24px;
}

.resource-booking-kicker,
.resource-booking-status,
.resource-booking-error {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.resource-booking-kicker {
  text-transform: uppercase;
}

.resource-booking-title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
}

.resource-booking-subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.5;
}

.resource-booking-error {
  color: var(--color-danger);
}

@media (max-width: 720px) {
  .resource-booking-page {
    padding: 20px;
  }
}
</style>
