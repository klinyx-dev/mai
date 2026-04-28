<script setup lang="ts">
import "@mai/mai-ui-vue/styles.css";
import {
  MaiBookingFlow,
  useMai,
  type MaiBookSlotPayload,
  type MaiBookingActorConfig,
  type MaiBookingDoctor,
  type MaiBookingSlotOwner,
  type MaiBookingSpecialty,
} from "@mai/mai-ui-vue";
import {
  COMMANDS,
  createBookSlotCommand,
  createCommandEnvelope,
  type WeeklyLayout,
  type WeeklyLayoutQueryPayload,
} from "@mai/mai-web-core";
import { computed, onMounted, ref, shallowRef } from "vue";

const route = useRoute();
const clinicId = computed(() => String(route.params.clinicId ?? "clinic-demo"));
const anchorDate = ref("2026-05-07");
const layout = shallowRef<WeeklyLayout | null>(null);
const statusMessage = ref("Choose a specialty to begin.");
const bookingError = ref<string | null>(null);
const signedInUser = ref<{ inviteeId: string; userDisplayName: string } | null>(
  null
);

let mai: ReturnType<typeof useMai> | null = null;
let appointmentCounter = 1;
const seeded = ref(false);

const specialties: MaiBookingSpecialty[] = [
  {
    specialtyId: "dermatology",
    label: "Dermatology",
    reasonLabel: "Skin consultation",
  },
  {
    specialtyId: "cardiology",
    label: "Cardiology",
    reasonLabel: "Heart consultation",
  },
];

const doctors: MaiBookingDoctor[] = [
  {
    doctorId: "doctor-derm-1",
    displayName: "Dr Martin",
    specialtyIds: ["dermatology"],
    resourceOwnerId: "owner-derm-1",
  },
  {
    doctorId: "doctor-derm-2",
    displayName: "Dr Simon",
    specialtyIds: ["dermatology"],
    resourceOwnerId: "owner-derm-2",
  },
  {
    doctorId: "doctor-cardio-1",
    displayName: "Dr Laurent",
    specialtyIds: ["cardiology"],
    resourceOwnerId: "owner-cardio-1",
  },
];

const slotOwners: Record<string, MaiBookingSlotOwner> = {
  "slot-derm-1": {
    resourceOwnerId: "owner-derm-1",
    doctorId: "doctor-derm-1",
    doctorDisplayName: "Dr Martin",
  },
  "slot-derm-2": {
    resourceOwnerId: "owner-derm-2",
    doctorId: "doctor-derm-2",
    doctorDisplayName: "Dr Simon",
  },
  "slot-cardio-1": {
    resourceOwnerId: "owner-cardio-1",
    doctorId: "doctor-cardio-1",
    doctorDisplayName: "Dr Laurent",
  },
};

const bookingActor = computed<MaiBookingActorConfig>(() => ({
  inviteeId: signedInUser.value?.inviteeId,
  userDisplayName: signedInUser.value?.userDisplayName,
  createdBy: signedInUser.value?.inviteeId,
}));

function nextAppointmentId(): string {
  const id = `clinic-demo-appointment-${appointmentCounter}`;
  appointmentCounter += 1;
  return id;
}

async function seedClinicSlots(): Promise<void> {
  if (!mai || seeded.value) {
    return;
  }

  const seedCommands = [
    createCommandEnvelope(COMMANDS.ADD_SLOT, {
      slot_id: "slot-derm-1",
      start: "2026-05-05T09:00:00Z",
      end: "2026-05-05T09:30:00Z",
      resource_owner_id: "owner-derm-1",
      created_by: "clinic-admin",
    }),
    createCommandEnvelope(COMMANDS.ADD_SLOT, {
      slot_id: "slot-derm-2",
      start: "2026-05-06T10:00:00Z",
      end: "2026-05-06T10:30:00Z",
      resource_owner_id: "owner-derm-2",
      created_by: "clinic-admin",
    }),
    createCommandEnvelope(COMMANDS.ADD_SLOT, {
      slot_id: "slot-cardio-1",
      start: "2026-05-07T11:00:00Z",
      end: "2026-05-07T11:30:00Z",
      resource_owner_id: "owner-cardio-1",
      created_by: "clinic-admin",
    }),
  ];

  for (const command of seedCommands) {
    await mai.mutate(command);
  }
  seeded.value = true;
}

async function queryLayout(payload: WeeklyLayoutQueryPayload): Promise<WeeklyLayout> {
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

async function bookSlot(payload: MaiBookSlotPayload): Promise<void> {
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
    inviteeId: "patient-demo",
    userDisplayName: "Camille Martin",
  };
  statusMessage.value = "Signed in as Camille Martin.";
  return signedInUser.value;
}

async function onBookingConfirmed(payload: MaiBookSlotPayload): Promise<void> {
  bookingError.value = null;
  statusMessage.value = `Confirmed: ${payload.title}`;
}

function onBookingError(payload: { action: string; message: string }): void {
  bookingError.value = `${payload.action}: ${payload.message}`;
}

onMounted(async () => {
  const { $mai } = useNuxtApp();
  mai = useMai({ adapter: $mai.adapter });
  await seedClinicSlots();
  await queryLayout({ anchor_date: anchorDate.value });
});
</script>

<template>
  <main class="clinic-booking-page">
    <section class="clinic-booking-header">
      <p class="clinic-booking-kicker">Clinic booking</p>
      <h1 class="clinic-booking-title">Book an appointment</h1>
      <p class="clinic-booking-subtitle">
        Choose a specialty, optionally choose a doctor, then confirm with your account.
      </p>
      <p class="clinic-booking-status">{{ statusMessage }}</p>
      <p v-if="bookingError" class="clinic-booking-error">{{ bookingError }}</p>
    </section>
    <ClientOnly>
      <MaiBookingFlow
        :clinic="{ clinicId, name: 'Mai Clinic' }"
        :specialties="specialties"
        :doctors="doctors"
        :layout="layout"
        :slot-owners="slotOwners"
        :view="{ anchorDate, visibleStartMinute: 480, visibleEndMinute: 1080 }"
        :actor="bookingActor"
        :booking="{ createAppointmentId: nextAppointmentId }"
        :actions="{ queryLayout, bookSlot, requestAuth }"
        @booking-confirmed="onBookingConfirmed"
        @booking-error="onBookingError"
      />
    </ClientOnly>
  </main>
</template>

<style scoped>
.clinic-booking-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 32px;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.clinic-booking-header {
  display: grid;
  gap: 8px;
  max-width: 760px;
  margin: 0 0 24px;
}

.clinic-booking-kicker,
.clinic-booking-status,
.clinic-booking-error {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.clinic-booking-kicker {
  text-transform: uppercase;
}

.clinic-booking-title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
}

.clinic-booking-subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.5;
}

.clinic-booking-error {
  color: var(--color-danger);
}

@media (max-width: 720px) {
  .clinic-booking-page {
    padding: 20px;
  }
}
</style>
