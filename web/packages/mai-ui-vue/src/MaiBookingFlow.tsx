import type {
  TypedCommandEnvelope,
  WasmResponse,
  WeeklyLayout,
  WeeklyLayoutQueryPayload,
} from "@mai/mai-web-core";
import {
  buildAppointmentTitle,
  createBookSlotCommand,
} from "@mai/mai-web-core";
import { computed, defineComponent, h, ref, type PropType } from "vue";
import { weekRangeLabel } from "./board/model/view-model.js";
import { MaiAvailabilityPicker } from "./booking/MaiAvailabilityPicker.js";
import { MaiBookingAuthGate } from "./booking/MaiBookingAuthGate.js";
import { MaiBookingConfirmCard } from "./booking/MaiBookingConfirmCard.js";
import { MaiDoctorPicker } from "./booking/MaiDoctorPicker.js";
import { MaiSpecialtyPicker } from "./booking/MaiSpecialtyPicker.js";
import {
  availabilitySlotsFromWeeklyLayout,
  sortAvailabilitySlots,
} from "./booking/availability.js";
import { eligibleDoctorsForSpecialty } from "./booking/options.js";
import {
  beginBookingConfirmation,
  bookingFlowError,
  completeBookingAuth,
  initialBookingFlowState,
  markAvailabilityRefreshing,
  markBookingConfirmed,
  selectBookingDoctor,
  selectBookingSlot,
  selectBookingSpecialty,
} from "./booking/state.js";
import type {
  MaiBookSlotPayload,
  MaiBookingActorConfig,
  MaiBookingAuthIdentity,
  MaiBookingAvailabilitySlot,
  MaiBookingClinic,
  MaiBookingConfig,
  MaiBookingDoctor,
  MaiBookingError,
  MaiBookingSlotOwner,
  MaiBookingSpecialty,
  MaiBookingViewConfig,
} from "./types/booking";

type BookingCommand = TypedCommandEnvelope<"add_appointment">;

export interface MaiBookingActionConfig {
  queryLayout?: (query: WeeklyLayoutQueryPayload) => Promise<WeeklyLayout>;
  bookSlot?: (payload: MaiBookSlotPayload) => Promise<void>;
  requestAuth?: () => Promise<MaiBookingAuthIdentity>;
  mutateCommand?: (envelope: BookingCommand) => Promise<WasmResponse<"applied">>;
}

function initialAuth(actor: MaiBookingActorConfig): MaiBookingAuthIdentity | null {
  if (!actor.inviteeId || !actor.userDisplayName) {
    return null;
  }
  return {
    inviteeId: actor.inviteeId,
    userDisplayName: actor.userDisplayName,
    createdBy: actor.createdBy,
  };
}

function createQueryPayload(
  view: MaiBookingViewConfig,
  doctor: MaiBookingDoctor | null
): WeeklyLayoutQueryPayload {
  return {
    anchor_date: view.anchorDate,
    timezone: view.timezone,
    visible_start_minute: view.visibleStartMinute,
    visible_end_minute: view.visibleEndMinute,
    view_filter: doctor
      ? {
          mode: "owners",
          ids: [doctor.resourceOwnerId],
        }
      : undefined,
  };
}

export const MaiBookingFlow = defineComponent({
  name: "MaiBookingFlow",
  props: {
    clinic: {
      type: Object as PropType<MaiBookingClinic>,
      required: true,
    },
    specialties: {
      type: Array as PropType<MaiBookingSpecialty[]>,
      required: true,
    },
    doctors: {
      type: Array as PropType<MaiBookingDoctor[]>,
      default: () => [],
    },
    layout: {
      type: Object as PropType<WeeklyLayout | null>,
      default: null,
    },
    availabilitySlots: {
      type: Array as PropType<MaiBookingAvailabilitySlot[]>,
      default: () => [],
    },
    slotOwners: {
      type: Object as PropType<Record<string, MaiBookingSlotOwner>>,
      default: () => ({}),
    },
    view: {
      type: Object as PropType<MaiBookingViewConfig>,
      required: true,
    },
    actor: {
      type: Object as PropType<MaiBookingActorConfig>,
      default: () => ({}),
    },
    booking: {
      type: Object as PropType<MaiBookingConfig>,
      default: () => ({}),
    },
    actions: {
      type: Object as PropType<MaiBookingActionConfig>,
      default: () => ({}),
    },
  },
  emits: {
    navigateWeek: (shift: -1 | 0 | 1) => shift === -1 || shift === 0 || shift === 1,
    specialtySelected: (specialtyId: string) => specialtyId.length > 0,
    doctorSelected: (doctorId: string | null) => doctorId === null || doctorId.length > 0,
    slotSelected: (slot: MaiBookingAvailabilitySlot) => slot.slotId.length > 0,
    authRequired: () => true,
    authCompleted: (auth: MaiBookingAuthIdentity) =>
      auth.inviteeId.length > 0 && auth.userDisplayName.length > 0,
    bookingSubmitted: (payload: MaiBookSlotPayload) => payload.slotId.length > 0,
    bookingConfirmed: (payload: MaiBookSlotPayload) => payload.slotId.length > 0,
    availabilityRefreshed: () => true,
    bookingError: (error: MaiBookingError) =>
      error.action.length > 0 && error.message.length > 0,
  },
  setup(props, { emit }) {
    const state = ref(initialBookingFlowState(initialAuth(props.actor)));
    const queriedLayout = ref<WeeklyLayout | null>(null);

    if (props.booking.selectedSpecialtyId) {
      state.value = selectBookingSpecialty(
        state.value,
        props.booking.selectedSpecialtyId
      );
      if (props.booking.selectedDoctorId) {
        state.value = selectBookingDoctor(
          state.value,
          props.booking.selectedDoctorId
        );
      }
    }

    const selectedSpecialty = computed(
      () =>
        props.specialties.find(
          (specialty) => specialty.specialtyId === state.value.selectedSpecialtyId
        ) ?? null
    );
    const selectedReason = computed(
      () => selectedSpecialty.value?.reasonLabel ?? selectedSpecialty.value?.label ?? ""
    );
    const eligibleDoctors = computed(() =>
      eligibleDoctorsForSpecialty(
        props.doctors,
        state.value.selectedSpecialtyId
      )
    );
    const selectedDoctor = computed(
      () =>
        props.doctors.find(
          (doctor) => doctor.doctorId === state.value.selectedDoctorId
        ) ?? null
    );
    const availableSlots = computed(() => {
      if (props.availabilitySlots.length > 0) {
        return sortAvailabilitySlots(props.availabilitySlots);
      }
      return availabilitySlotsFromWeeklyLayout(
        queriedLayout.value ?? props.layout,
        props.slotOwners
      );
    });
    const selectedSlot = computed(
      () =>
        availableSlots.value.find(
          (slot) => slot.slotId === state.value.selectedSlot?.slotId
        ) ?? state.value.selectedSlot
    );
    const weekLabel = computed(() => {
      const layout = queriedLayout.value ?? props.layout;
      if (layout) {
        return weekRangeLabel(layout.week_start, layout.week_end);
      }
      return props.view.anchorDate;
    });

    async function refreshAvailability(): Promise<void> {
      if (!props.actions.queryLayout) {
        return;
      }
      queriedLayout.value = await props.actions.queryLayout(
        createQueryPayload(props.view, selectedDoctor.value)
      );
    }

    function emitError(action: string, message: string): void {
      const error = { action, message };
      state.value = bookingFlowError(state.value, error);
      emit("bookingError", error);
    }

    async function handleSpecialtySelected(specialtyId: string): Promise<void> {
      state.value = selectBookingSpecialty(state.value, specialtyId);
      emit("specialtySelected", specialtyId);
      await refreshAvailability();
    }

    async function handleDoctorSelected(doctorId: string | null): Promise<void> {
      state.value = selectBookingDoctor(state.value, doctorId);
      emit("doctorSelected", doctorId);
      await refreshAvailability();
    }

    function handleSlotSelected(slot: MaiBookingAvailabilitySlot): void {
      state.value = selectBookingSlot(state.value, slot);
      emit("slotSelected", slot);
    }

    async function ensureAuth(): Promise<MaiBookingAuthIdentity | null> {
      if (state.value.auth?.inviteeId) {
        return state.value.auth;
      }
      emit("authRequired");
      state.value = beginBookingConfirmation(state.value);
      if (!props.actions.requestAuth) {
        return null;
      }
      const auth = await props.actions.requestAuth();
      state.value = completeBookingAuth(state.value, auth);
      emit("authCompleted", auth);
      return auth;
    }

    async function submitBooking(): Promise<void> {
      const auth = await ensureAuth();
      if (!auth) {
        return;
      }

      const slot = selectedSlot.value;
      if (!selectedSpecialty.value || !slot) {
        emitError("confirm-booking", "select a specialty and slot before confirming");
        return;
      }

      const appointmentId = props.booking.createAppointmentId?.();
      if (!appointmentId) {
        emitError("confirm-booking", "appointment id factory is required");
        return;
      }

      const payload: MaiBookSlotPayload = {
        appointmentId,
        slotId: slot.slotId,
        inviteeId: auth.inviteeId,
        createdBy: auth.createdBy ?? auth.inviteeId,
        userDisplayName: auth.userDisplayName,
        reason: selectedReason.value,
        title: buildAppointmentTitle({
          userDisplayName: auth.userDisplayName,
          reason: selectedReason.value,
        }),
      };

      const command = createBookSlotCommand(payload);
      state.value = beginBookingConfirmation(state.value);
      emit("bookingSubmitted", payload);

      try {
        if (props.actions.bookSlot) {
          await props.actions.bookSlot(payload);
        } else if (props.actions.mutateCommand) {
          await props.actions.mutateCommand(command);
        } else {
          throw new Error("no booking action configured");
        }

        state.value = markAvailabilityRefreshing(state.value);
        await refreshAvailability();
        emit("availabilityRefreshed");
        state.value = markBookingConfirmed(state.value);
        emit("bookingConfirmed", payload);
      } catch (error) {
        emitError(
          "confirm-booking",
          error instanceof Error && error.message
            ? error.message
            : "booking failed"
        );
      }
    }

    return () => (
      <section class="mai-booking-flow" aria-label={`${props.clinic.name ?? "Clinic"} booking`}>
        <MaiSpecialtyPicker
          specialties={props.specialties}
          selectedSpecialtyId={state.value.selectedSpecialtyId ?? undefined}
          onSpecialtySelected={handleSpecialtySelected}
        />
        {state.value.selectedSpecialtyId ? (
          <MaiDoctorPicker
            doctors={eligibleDoctors.value}
            selectedSpecialtyId={state.value.selectedSpecialtyId}
            selectedDoctorId={state.value.selectedDoctorId ?? undefined}
            onDoctorSelected={handleDoctorSelected}
          />
        ) : null}
        {state.value.selectedSpecialtyId ? (
          <MaiAvailabilityPicker
            slots={availableSlots.value}
            selectedSlotId={state.value.selectedSlot?.slotId ?? undefined}
            weekLabel={weekLabel.value}
            timeLabelFormat={props.view.timeLabelFormat ?? "24h"}
            onNavigateWeek={(shift) => emit("navigateWeek", shift)}
            onSlotSelected={handleSlotSelected}
          />
        ) : null}
        {state.value.selectedSlot && !state.value.auth?.inviteeId ? (
          <MaiBookingAuthGate
            hasInvitee={false}
            isBusy={state.value.step === "submitting"}
            onRequestAuth={ensureAuth}
          />
        ) : null}
        {state.value.selectedSlot && state.value.auth?.inviteeId && selectedReason.value ? (
          <MaiBookingConfirmCard
            reason={selectedReason.value}
            userDisplayName={state.value.auth.userDisplayName}
            slot={state.value.selectedSlot}
            doctorDisplayName={selectedDoctor.value?.displayName ?? ""}
            timeLabelFormat={props.view.timeLabelFormat ?? "24h"}
            isBusy={
              state.value.step === "submitting" || state.value.step === "refreshing"
            }
            onBack={() => {
              state.value = {
                ...state.value,
                selectedSlot: null,
                step: "select-slot",
              };
            }}
            onConfirm={submitBooking}
          />
        ) : null}
      </section>
    );
  },
});
