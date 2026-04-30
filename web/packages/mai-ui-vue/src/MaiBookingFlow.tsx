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
import { computed, defineComponent, h, ref, watch, type PropType } from "vue";
import { weekRangeLabel } from "./board/model/view-model.js";
import { MaiAvailabilityPicker } from "./booking/MaiAvailabilityPicker.js";
import { MaiBookingAuthGate } from "./booking/MaiBookingAuthGate.js";
import { MaiBookingConfirmCard } from "./booking/MaiBookingConfirmCard.js";
import { MaiCategoryPicker } from "./booking/MaiCategoryPicker.js";
import { MaiLocationPicker } from "./booking/MaiLocationPicker.js";
import { MaiResourcePicker } from "./booking/MaiResourcePicker.js";
import {
  availabilitySlotsFromWeeklyLayout,
  dedupeAvailabilitySlotsByStartMinute,
  sortAvailabilitySlots,
} from "./booking/availability.js";
import { eligibleResourcesForCategory } from "./booking/options.js";
import {
  beginBookingConfirmation,
  bookingFlowError,
  completeBookingAuth,
  initialBookingFlowState,
  markAvailabilityRefreshing,
  markBookingConfirmed,
  selectBookingCategory,
  selectBookingLocation,
  selectBookingResource,
  selectBookingSlot,
  setBookingNotes,
} from "./booking/state.js";
import type {
  MaiBookSlotPayload,
  MaiBookingActorConfig,
  MaiBookingAuthIdentity,
  MaiBookingAvailabilitySlot,
  MaiBookingCategory,
  MaiBookingConfig,
  MaiBookingContext,
  MaiBookingCopy,
  MaiBookingError,
  MaiBookingFlowState,
  MaiBookingLocation,
  MaiBookingResource,
  MaiBookingSlotOwner,
  MaiBookingViewConfig,
} from "./types/booking";
import { MAI_BOOKING_FLOW_EVENTS } from "./types/booking.js";
import {
  isBookSlotPayload,
  isBookingAuthIdentity,
  isBookingAvailabilitySlot,
  isBookingError,
  isNonEmptyString,
  isNullableNonEmptyString,
  isWeekShift,
} from "./validators/events.js";

type BookingCommand = TypedCommandEnvelope<"add_appointment">;

export interface MaiBookingActionConfig {
  queryLayout?: (query: WeeklyLayoutQueryPayload) => Promise<WeeklyLayout>;
  bookSlot?: (payload: MaiBookSlotPayload) => Promise<void>;
  requestAuth?: () => Promise<MaiBookingAuthIdentity | null | undefined>;
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
  resource: MaiBookingResource | null
): WeeklyLayoutQueryPayload {
  return {
    anchor_date: view.anchorDate,
    timezone: view.timezone,
    visible_start_minute: view.visibleStartMinute,
    visible_end_minute: view.visibleEndMinute,
    view_filter: resource
      ? {
          mode: "owners",
          ids: [resource.resourceOwnerId],
        }
      : undefined,
  };
}

function normalizeInitialState(params: {
  actor: MaiBookingActorConfig;
  booking: MaiBookingConfig;
  locations: MaiBookingLocation[];
  modelValue: MaiBookingFlowState | null;
}): MaiBookingFlowState {
  if (params.modelValue) {
    return params.modelValue;
  }

  let state = initialBookingFlowState(initialAuth(params.actor));
  const shouldAutoSelectLocation =
    params.booking.autoSelectSingleLocation &&
    params.locations.length === 1 &&
    !params.booking.selectedLocationId;

  if (shouldAutoSelectLocation) {
    state = selectBookingLocation(state, params.locations[0].locationId);
  } else if (params.booking.selectedLocationId) {
    state = selectBookingLocation(state, params.booking.selectedLocationId);
  }

  if (params.booking.selectedCategoryId) {
    state = selectBookingCategory(state, params.booking.selectedCategoryId);
    if (params.booking.selectedResourceId) {
      state = selectBookingResource(state, params.booking.selectedResourceId);
    }
  }

  if (params.booking.notes) {
    state = setBookingNotes(state, params.booking.notes);
  }

  if (params.locations.length > 0 && !state.selectedLocationId) {
    state = { ...state, step: "select-location" };
  }

  return state;
}

export const MaiBookingFlow = defineComponent({
  name: "MaiBookingFlow",
  props: {
    context: {
      type: Object as PropType<MaiBookingContext>,
      required: true,
    },
    locations: {
      type: Array as PropType<MaiBookingLocation[]>,
      default: () => [],
    },
    categories: {
      type: Array as PropType<MaiBookingCategory[]>,
      required: true,
    },
    resources: {
      type: Array as PropType<MaiBookingResource[]>,
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
    copy: {
      type: Object as PropType<MaiBookingCopy>,
      default: () => ({}),
    },
    actions: {
      type: Object as PropType<MaiBookingActionConfig>,
      default: () => ({}),
    },
    modelValue: {
      type: Object as PropType<MaiBookingFlowState | null>,
      default: null,
    },
  },
  emits: {
    [MAI_BOOKING_FLOW_EVENTS.UPDATE_MODEL_VALUE]: (state: MaiBookingFlowState) =>
      typeof state.step === "string",
    [MAI_BOOKING_FLOW_EVENTS.NAVIGATE_WEEK]: (shift: -1 | 0 | 1) =>
      isWeekShift(shift),
    [MAI_BOOKING_FLOW_EVENTS.LOCATION_SELECTED]: (locationId: string) =>
      isNonEmptyString(locationId),
    [MAI_BOOKING_FLOW_EVENTS.CATEGORY_SELECTED]: (categoryId: string) =>
      isNonEmptyString(categoryId),
    [MAI_BOOKING_FLOW_EVENTS.RESOURCE_SELECTED]: (resourceId: string | null) =>
      isNullableNonEmptyString(resourceId),
    [MAI_BOOKING_FLOW_EVENTS.SLOT_SELECTED]: (slot: MaiBookingAvailabilitySlot) =>
      isBookingAvailabilitySlot(slot),
    [MAI_BOOKING_FLOW_EVENTS.AUTH_REQUIRED]: () => true,
    [MAI_BOOKING_FLOW_EVENTS.AUTH_COMPLETED]: (auth: MaiBookingAuthIdentity) =>
      isBookingAuthIdentity(auth),
    [MAI_BOOKING_FLOW_EVENTS.BOOKING_SUBMITTED]: (payload: MaiBookSlotPayload) =>
      isBookSlotPayload(payload),
    [MAI_BOOKING_FLOW_EVENTS.BOOKING_CONFIRMED]: (payload: MaiBookSlotPayload) =>
      isBookSlotPayload(payload),
    [MAI_BOOKING_FLOW_EVENTS.AVAILABILITY_REFRESHED]: () => true,
    [MAI_BOOKING_FLOW_EVENTS.BOOKING_ERROR]: (error: MaiBookingError) =>
      isBookingError(error),
  },
  setup(props, { emit }) {
    const state = ref(
      normalizeInitialState({
        actor: props.actor,
        booking: props.booking,
        locations: props.locations,
        modelValue: props.modelValue,
      })
    );
    const queriedLayout = ref<WeeklyLayout | null>(null);

    function setState(nextState: MaiBookingFlowState): void {
      state.value = nextState;
      emit(MAI_BOOKING_FLOW_EVENTS.UPDATE_MODEL_VALUE, nextState);
    }

    watch(
      () => props.modelValue,
      (nextState) => {
        if (nextState) {
          state.value = nextState;
        }
      }
    );

    watch(
      () => [props.actor.inviteeId, props.actor.userDisplayName, props.actor.createdBy],
      () => {
        const auth = initialAuth(props.actor);
        if (auth && auth.inviteeId !== state.value.auth?.inviteeId) {
          setState(completeBookingAuth(state.value, auth));
          emit(MAI_BOOKING_FLOW_EVENTS.AUTH_COMPLETED, auth);
        }
      }
    );

    const selectedLocation = computed(
      () =>
        props.locations.find(
          (location) => location.locationId === state.value.selectedLocationId
        ) ?? null
    );
    const selectedCategory = computed(
      () =>
        props.categories.find(
          (category) => category.categoryId === state.value.selectedCategoryId
        ) ?? null
    );
    const selectedReason = computed(
      () => selectedCategory.value?.description ?? selectedCategory.value?.label ?? ""
    );
    const eligibleResources = computed(() =>
      eligibleResourcesForCategory(
        props.resources,
        state.value.selectedCategoryId
      )
    );
    const eligibleResourceOwnerIds = computed(
      () => new Set(eligibleResources.value.map((resource) => resource.resourceOwnerId))
    );
    const selectedResource = computed(
      () =>
        props.resources.find(
          (resource) => resource.resourceId === state.value.selectedResourceId
        ) ?? null
    );
    const availableSlots = computed(() => {
      const baseSlots =
        props.availabilitySlots.length > 0
          ? sortAvailabilitySlots(props.availabilitySlots)
          : availabilitySlotsFromWeeklyLayout(
              queriedLayout.value ?? props.layout,
              props.slotOwners
            );

      const filteredByResource = selectedResource.value
        ? baseSlots.filter(
            (slot) =>
              (!slot.resourceOwnerId ||
                slot.resourceOwnerId === selectedResource.value?.resourceOwnerId) &&
              (!slot.resourceId || slot.resourceId === selectedResource.value?.resourceId)
          )
        : state.value.selectedCategoryId
          ? baseSlots.filter(
              (slot) =>
                !slot.resourceOwnerId ||
                eligibleResourceOwnerIds.value.has(slot.resourceOwnerId)
            )
          : baseSlots;

      if (!selectedResource.value && props.booking.dedupeAvailabilityByStartMinute) {
        return dedupeAvailabilitySlotsByStartMinute(filteredByResource);
      }

      return sortAvailabilitySlots(filteredByResource);
    });
    const selectedSlot = computed(
      () =>
        availableSlots.value.find(
          (slot) => slot.slotId === state.value.selectedSlot?.slotId
        ) ?? state.value.selectedSlot
    );
    const weekLabel = computed(() => {
      if (props.view.weekLabel) {
        return props.view.weekLabel;
      }
      const layout = queriedLayout.value ?? props.layout;
      if (layout) {
        return weekRangeLabel(layout.week_start, layout.week_end);
      }
      return props.view.anchorDate;
    });
    const locationRequired = computed(() => props.locations.length > 0);
    const canChooseCategory = computed(
      () => !locationRequired.value || Boolean(state.value.selectedLocationId)
    );

    async function refreshAvailability(): Promise<void> {
      if (!props.actions.queryLayout) {
        return;
      }
      queriedLayout.value = await props.actions.queryLayout(
        createQueryPayload(props.view, selectedResource.value)
      );
    }

    function emitError(action: string, message: string): void {
      const error = { action, message };
      setState(bookingFlowError(state.value, error));
      emit(MAI_BOOKING_FLOW_EVENTS.BOOKING_ERROR, error);
    }

    function handleLocationSelected(locationId: string): void {
      setState(selectBookingLocation(state.value, locationId));
      emit(MAI_BOOKING_FLOW_EVENTS.LOCATION_SELECTED, locationId);
    }

    async function handleCategorySelected(categoryId: string): Promise<void> {
      setState(selectBookingCategory(state.value, categoryId));
      emit(MAI_BOOKING_FLOW_EVENTS.CATEGORY_SELECTED, categoryId);
      await refreshAvailability();
    }

    async function handleResourceSelected(resourceId: string | null): Promise<void> {
      setState(selectBookingResource(state.value, resourceId));
      emit(MAI_BOOKING_FLOW_EVENTS.RESOURCE_SELECTED, resourceId);
      await refreshAvailability();
    }

    function handleSlotSelected(slot: MaiBookingAvailabilitySlot): void {
      setState(selectBookingSlot(state.value, slot));
      emit(MAI_BOOKING_FLOW_EVENTS.SLOT_SELECTED, slot);
    }

    function handleNotesInput(event: Event): void {
      const target = event.target instanceof HTMLTextAreaElement ? event.target : null;
      setState(setBookingNotes(state.value, target?.value ?? ""));
    }

    async function ensureAuth(): Promise<MaiBookingAuthIdentity | null> {
      if (state.value.auth?.inviteeId) {
        return state.value.auth;
      }
      emit(MAI_BOOKING_FLOW_EVENTS.AUTH_REQUIRED);
      setState(beginBookingConfirmation(state.value));
      if (!props.actions.requestAuth) {
        return null;
      }
      const auth = await props.actions.requestAuth();
      if (!auth) {
        return null;
      }
      setState(completeBookingAuth(state.value, auth));
      emit(MAI_BOOKING_FLOW_EVENTS.AUTH_COMPLETED, auth);
      return auth;
    }

    async function submitBooking(): Promise<void> {
      const auth = await ensureAuth();
      if (!auth) {
        return;
      }

      const slot = selectedSlot.value;
      if (!selectedCategory.value || !slot) {
        emitError("confirm-booking", "select a category and slot before confirming");
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
        notes: state.value.notes || undefined,
        locationId: state.value.selectedLocationId ?? undefined,
        categoryId: selectedCategory.value.categoryId,
        resourceId: selectedResource.value?.resourceId ?? slot.resourceId,
        metadata: {
          context: props.context.metadata,
          location: selectedLocation.value?.metadata,
          category: selectedCategory.value.metadata,
          resource: selectedResource.value?.metadata,
          slot: slot.metadata,
        },
      };

      const command = createBookSlotCommand(payload);
      setState(beginBookingConfirmation(state.value));
      emit(MAI_BOOKING_FLOW_EVENTS.BOOKING_SUBMITTED, payload);

      try {
        if (props.actions.bookSlot) {
          await props.actions.bookSlot(payload);
        } else if (props.actions.mutateCommand) {
          await props.actions.mutateCommand(command);
        } else {
          throw new Error("no booking action configured");
        }

        setState(markAvailabilityRefreshing(state.value));
        await refreshAvailability();
        emit(MAI_BOOKING_FLOW_EVENTS.AVAILABILITY_REFRESHED);
        setState(markBookingConfirmed(state.value));
        emit(MAI_BOOKING_FLOW_EVENTS.BOOKING_CONFIRMED, payload);
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
      <section class="mai-booking-flow" aria-label={`${props.context.label ?? "Resource"} booking`}>
        {props.locations.length > 0 ? (
          <MaiLocationPicker
            locations={props.locations}
            selectedLocationId={state.value.selectedLocationId ?? undefined}
            copy={props.copy}
            onLocationSelected={handleLocationSelected}
          />
        ) : null}
        {canChooseCategory.value ? (
          <MaiCategoryPicker
            categories={props.categories}
            selectedCategoryId={state.value.selectedCategoryId ?? undefined}
            copy={props.copy}
            onCategorySelected={handleCategorySelected}
          />
        ) : null}
        {state.value.selectedCategoryId ? (
          <MaiResourcePicker
            resources={eligibleResources.value}
            selectedCategoryId={state.value.selectedCategoryId}
            selectedResourceId={state.value.selectedResourceId ?? undefined}
            copy={props.copy}
            onResourceSelected={handleResourceSelected}
          />
        ) : null}
        {state.value.selectedCategoryId ? (
          <MaiAvailabilityPicker
            slots={availableSlots.value}
            selectedSlotId={state.value.selectedSlot?.slotId ?? undefined}
            weekLabel={weekLabel.value}
            timeLabelFormat={props.view.timeLabelFormat ?? "24h"}
            slotVisibility={props.booking.slotVisibility ?? "available-only"}
            isLoading={props.booking.isAvailabilityLoading ?? state.value.step === "refreshing"}
            copy={props.copy}
            onNavigateWeek={(shift) => emit(MAI_BOOKING_FLOW_EVENTS.NAVIGATE_WEEK, shift)}
            onSlotSelected={handleSlotSelected}
          />
        ) : null}
        {state.value.selectedSlot ? (
          <section class="mai-booking-card" aria-labelledby="mai-booking-notes-title">
            <div class="mai-booking-card__body">
              <h3 class="mai-booking-card__title" id="mai-booking-notes-title">
                {props.copy.notesTitle ?? "Notes"}
              </h3>
              <textarea
                class="mai-booking-notes"
                value={state.value.notes}
                placeholder={props.copy.notesPlaceholder ?? ""}
                onInput={handleNotesInput}
              />
            </div>
          </section>
        ) : null}
        {state.value.selectedSlot && !state.value.auth?.inviteeId ? (
          <MaiBookingAuthGate
            hasInvitee={false}
            isBusy={state.value.step === "submitting"}
            copy={props.copy}
            onRequestAuth={ensureAuth}
          />
        ) : null}
        {state.value.selectedSlot && state.value.auth?.inviteeId && selectedReason.value ? (
          <MaiBookingConfirmCard
            reason={selectedReason.value}
            userDisplayName={state.value.auth.userDisplayName}
            slot={state.value.selectedSlot}
            location={selectedLocation.value}
            resourceLabel={selectedResource.value?.label ?? selectedSlot.value?.resourceLabel ?? ""}
            notes={state.value.notes}
            timeLabelFormat={props.view.timeLabelFormat ?? "24h"}
            isBusy={
              state.value.step === "submitting" || state.value.step === "refreshing"
            }
            copy={props.copy}
            onBack={() => {
              setState({
                ...state.value,
                selectedSlot: null,
                step: "select-slot",
              });
            }}
            onConfirm={submitBooking}
          />
        ) : null}
      </section>
    );
  },
});
