import type {
  MaiBookingAuthIdentity,
  MaiBookingError,
  MaiBookingFlowState,
  MaiBookingResource,
  MaiBookingSlotSelection,
} from "../../../types/booking";

export function initialBookingFlowState(
  auth: MaiBookingAuthIdentity | null = null
): MaiBookingFlowState {
  return {
    step: "select-category",
    selectedLocationId: null,
    selectedCategoryId: null,
    selectedResourceId: null,
    selectedSlot: null,
    notes: "",
    auth,
    error: null,
  };
}

export function selectBookingLocation(
  state: MaiBookingFlowState,
  locationId: string | null
): MaiBookingFlowState {
  return {
    ...state,
    step: "select-category",
    selectedLocationId: locationId,
    selectedSlot: null,
    error: null,
  };
}

export function selectBookingCategory(
  state: MaiBookingFlowState,
  categoryId: string
): MaiBookingFlowState {
  return {
    ...state,
    step: "select-slot",
    selectedCategoryId: categoryId,
    selectedResourceId: null,
    selectedSlot: null,
    error: null,
  };
}

export function selectBookingResource(
  state: MaiBookingFlowState,
  resourceId: string | null
): MaiBookingFlowState {
  return {
    ...state,
    step: state.selectedCategoryId ? "select-slot" : "select-category",
    selectedResourceId: resourceId,
    selectedSlot: null,
    error: null,
  };
}

export function resourceSupportsCategory(
  resource: MaiBookingResource,
  categoryId: string
): boolean {
  return resource.categoryIds.includes(categoryId);
}

export function selectCompatibleBookingResource(
  state: MaiBookingFlowState,
  resource: MaiBookingResource | null
): MaiBookingFlowState {
  if (!resource || !state.selectedCategoryId) {
    return selectBookingResource(state, null);
  }

  if (!resourceSupportsCategory(resource, state.selectedCategoryId)) {
    return selectBookingResource(state, null);
  }

  return selectBookingResource(state, resource.resourceId);
}

export function selectBookingSlot(
  state: MaiBookingFlowState,
  slot: MaiBookingSlotSelection
): MaiBookingFlowState {
  if (!state.selectedCategoryId) {
    return bookingFlowError(state, {
      action: "select-slot",
      message: "select a category before choosing a slot",
    });
  }

  return {
    ...state,
    step: "select-slot",
    selectedSlot: slot,
    error: null,
  };
}

export function setBookingNotes(
  state: MaiBookingFlowState,
  notes: string
): MaiBookingFlowState {
  return {
    ...state,
    notes,
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
    state.selectedCategoryId &&
      state.selectedSlot &&
      state.auth?.inviteeId &&
      state.auth.userDisplayName
  );
}

export function beginBookingConfirmation(
  state: MaiBookingFlowState
): MaiBookingFlowState {
  if (!state.selectedCategoryId) {
    return bookingFlowError(state, {
      action: "confirm-booking",
      message: "select a category before confirming",
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
