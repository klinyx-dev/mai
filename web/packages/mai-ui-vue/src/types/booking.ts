export type MaiBookingStep =
  | "select-location"
  | "select-category"
  | "select-slot"
  | "auth-required"
  | "submitting"
  | "refreshing"
  | "confirmed"
  | "error";

export type MaiBookingSlotStatus = "available" | "booked" | "cancelled";
export type MaiBookingSlotVisibility = "available-only" | "show-disabled" | "all";

export type MaiBookingMetadata = Record<string, unknown>;

export interface MaiBookingContext {
  contextId: string;
  label?: string;
  metadata?: MaiBookingMetadata;
}

export interface MaiBookingLocation {
  locationId: string;
  label: string;
  description?: string;
  metadata?: MaiBookingMetadata;
}

export interface MaiBookingCategory {
  categoryId: string;
  label: string;
  description?: string;
  metadata?: MaiBookingMetadata;
}

export interface MaiBookingResource {
  resourceId: string;
  label: string;
  categoryIds: string[];
  resourceOwnerId: string;
  metadata?: MaiBookingMetadata;
}

export interface MaiBookingSlotSelection {
  slotId: string;
  dayIndex: number;
  startMinute: number;
  endMinute: number;
  resourceOwnerId?: string;
  resourceId?: string;
  resourceLabel?: string;
  status?: MaiBookingSlotStatus;
  metadata?: MaiBookingMetadata;
}

export interface MaiBookingAvailabilitySlot extends MaiBookingSlotSelection {}

export interface MaiBookingSlotOwner {
  resourceOwnerId: string;
  resourceId?: string;
  resourceLabel?: string;
  metadata?: MaiBookingMetadata;
}

export interface MaiBookingViewConfig {
  anchorDate: string;
  weekLabel?: string;
  timezone?: string;
  visibleStartMinute?: number;
  visibleEndMinute?: number;
  timeLabelFormat?: "24h" | "12h";
}

export interface MaiBookingActorConfig {
  inviteeId?: string;
  userDisplayName?: string;
  createdBy?: string;
}

export interface MaiBookingConfig {
  selectedLocationId?: string;
  selectedCategoryId?: string;
  selectedResourceId?: string;
  notes?: string;
  autoSelectSingleLocation?: boolean;
  isAvailabilityLoading?: boolean;
  slotVisibility?: MaiBookingSlotVisibility;
  dedupeAvailabilityByStartMinute?: boolean;
  createAppointmentId?: () => string;
}

export interface MaiBookingCopy {
  locationEyebrow?: string;
  locationTitle?: string;
  categoryEyebrow?: string;
  categoryTitle?: string;
  resourceEyebrow?: string;
  resourceTitle?: string;
  resourceDescription?: string;
  anyResourceLabel?: string;
  anyResourceMeta?: string;
  availabilityEyebrow?: string;
  availabilityTitle?: string;
  availabilityAriaLabel?: string;
  previousWeek?: string;
  nextWeek?: string;
  loadingAvailability?: string;
  emptyAvailability?: string;
  emptyDay?: string;
  authEyebrow?: string;
  authTitle?: string;
  authDescription?: string;
  authAction?: string;
  confirmEyebrow?: string;
  confirmTitle?: string;
  confirmTitleLabel?: string;
  confirmTimeLabel?: string;
  confirmResourceLabel?: string;
  confirmNotesLabel?: string;
  notesTitle?: string;
  notesPlaceholder?: string;
  backAction?: string;
  confirmAction?: string;
}

export interface MaiBookSlotPayload {
  appointmentId: string;
  slotId: string;
  inviteeId: string;
  createdBy: string;
  userDisplayName: string;
  reason: string;
  title: string;
  notes?: string;
  locationId?: string;
  categoryId: string;
  resourceId?: string;
  metadata?: MaiBookingMetadata;
}

export interface MaiBookingAuthIdentity {
  inviteeId: string;
  userDisplayName: string;
  createdBy?: string;
}

export interface MaiBookingError {
  action: string;
  message: string;
}

export interface MaiBookingFlowState {
  step: MaiBookingStep;
  selectedLocationId: string | null;
  selectedCategoryId: string | null;
  selectedResourceId: string | null;
  selectedSlot: MaiBookingSlotSelection | null;
  notes: string;
  auth: MaiBookingAuthIdentity | null;
  error: MaiBookingError | null;
}

export const MAI_BOOKING_FLOW_EVENTS = {
  UPDATE_MODEL_VALUE: "update:modelValue",
  NAVIGATE_WEEK: "navigateWeek",
  LOCATION_SELECTED: "locationSelected",
  CATEGORY_SELECTED: "categorySelected",
  RESOURCE_SELECTED: "resourceSelected",
  SLOT_SELECTED: "slotSelected",
  AUTH_REQUIRED: "authRequired",
  AUTH_COMPLETED: "authCompleted",
  BOOKING_SUBMITTED: "bookingSubmitted",
  BOOKING_CONFIRMED: "bookingConfirmed",
  AVAILABILITY_REFRESHED: "availabilityRefreshed",
  BOOKING_ERROR: "bookingError",
} as const;

export type MaiBookingFlowEvent =
  (typeof MAI_BOOKING_FLOW_EVENTS)[keyof typeof MAI_BOOKING_FLOW_EVENTS];
