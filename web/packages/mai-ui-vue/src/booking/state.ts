import type {
  MaiBookingAuthIdentity,
  MaiBookingDoctor,
  MaiBookingError,
  MaiBookingFlowState,
  MaiBookingSlotSelection,
} from "../types/booking";

export function initialBookingFlowState(
  auth: MaiBookingAuthIdentity | null = null
): MaiBookingFlowState {
  return {
    step: "select-specialty",
    selectedSpecialtyId: null,
    selectedDoctorId: null,
    selectedSlot: null,
    auth,
    error: null,
  };
}

export function selectBookingSpecialty(
  state: MaiBookingFlowState,
  specialtyId: string
): MaiBookingFlowState {
  return {
    ...state,
    step: "select-slot",
    selectedSpecialtyId: specialtyId,
    selectedDoctorId: null,
    selectedSlot: null,
    error: null,
  };
}

export function selectBookingDoctor(
  state: MaiBookingFlowState,
  doctorId: string | null
): MaiBookingFlowState {
  return {
    ...state,
    step: state.selectedSpecialtyId ? "select-slot" : "select-specialty",
    selectedDoctorId: doctorId,
    selectedSlot: null,
    error: null,
  };
}

export function doctorSupportsSpecialty(
  doctor: MaiBookingDoctor,
  specialtyId: string
): boolean {
  return doctor.specialtyIds.includes(specialtyId);
}

export function selectCompatibleBookingDoctor(
  state: MaiBookingFlowState,
  doctor: MaiBookingDoctor | null
): MaiBookingFlowState {
  if (!doctor || !state.selectedSpecialtyId) {
    return selectBookingDoctor(state, null);
  }

  if (!doctorSupportsSpecialty(doctor, state.selectedSpecialtyId)) {
    return selectBookingDoctor(state, null);
  }

  return selectBookingDoctor(state, doctor.doctorId);
}

export function selectBookingSlot(
  state: MaiBookingFlowState,
  slot: MaiBookingSlotSelection
): MaiBookingFlowState {
  if (!state.selectedSpecialtyId) {
    return bookingFlowError(state, {
      action: "select-slot",
      message: "select a specialty before choosing a slot",
    });
  }

  return {
    ...state,
    step: "select-slot",
    selectedSlot: slot,
    error: null,
  };
}

export function completeBookingAuth(
  state: MaiBookingFlowState,
  auth: MaiBookingAuthIdentity
): MaiBookingFlowState {
  return {
    ...state,
    step: state.selectedSlot ? "select-slot" : state.step,
    auth,
    error: null,
  };
}

export function canSubmitBooking(state: MaiBookingFlowState): boolean {
  return Boolean(
    state.selectedSpecialtyId &&
      state.selectedSlot &&
      state.auth?.inviteeId &&
      state.auth.userDisplayName
  );
}

export function beginBookingConfirmation(
  state: MaiBookingFlowState
): MaiBookingFlowState {
  if (!state.selectedSpecialtyId) {
    return bookingFlowError(state, {
      action: "confirm-booking",
      message: "select a specialty before confirming",
    });
  }

  if (!state.selectedSlot) {
    return bookingFlowError(state, {
      action: "confirm-booking",
      message: "select a slot before confirming",
    });
  }

  if (!state.auth?.inviteeId) {
    return {
      ...state,
      step: "auth-required",
      error: null,
    };
  }

  return {
    ...state,
    step: "submitting",
    error: null,
  };
}

export function markBookingSubmitting(
  state: MaiBookingFlowState
): MaiBookingFlowState {
  return {
    ...state,
    step: "submitting",
    error: null,
  };
}

export function markAvailabilityRefreshing(
  state: MaiBookingFlowState
): MaiBookingFlowState {
  return {
    ...state,
    step: "refreshing",
    error: null,
  };
}

export function markBookingConfirmed(
  state: MaiBookingFlowState
): MaiBookingFlowState {
  return {
    ...state,
    step: "confirmed",
    selectedSlot: null,
    error: null,
  };
}

export function bookingFlowError(
  state: MaiBookingFlowState,
  error: MaiBookingError
): MaiBookingFlowState {
  return {
    ...state,
    step: "error",
    error,
  };
}
