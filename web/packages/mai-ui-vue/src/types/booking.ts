import type { TimeLabelFormat } from "./board";

export const MAI_BOOKING_STEPS = {
  SELECT_LOCATION: "select-location",
  SELECT_CATEGORY: "select-category",
  SELECT_SLOT: "select-slot",
  AUTH_REQUIRED: "auth-required",
  SUBMITTING: "submitting",
  REFRESHING: "refreshing",
  CONFIRMED: "confirmed",
  ERROR: "error",
} as const;

export type MaiBookingStep =
  (typeof MAI_BOOKING_STEPS)[keyof typeof MAI_BOOKING_STEPS];

export const MAI_BOOKING_SLOT_STATUSES = {
  AVAILABLE: "available",
  BOOKED: "booked",
  CANCELLED: "cancelled",
} as const;

export type MaiBookingSlotStatus =
  (typeof MAI_BOOKING_SLOT_STATUSES)[keyof typeof MAI_BOOKING_SLOT_STATUSES];

export const MAI_BOOKING_SLOT_VISIBILITIES = {
  AVAILABLE_ONLY: "available-only",
  SHOW_DISABLED: "show-disabled",
  ALL: "all",
} as const;

export type MaiBookingSlotVisibility =
  (typeof MAI_BOOKING_SLOT_VISIBILITIES)[keyof typeof MAI_BOOKING_SLOT_VISIBILITIES];

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
  timeLabelFormat?: TimeLabelFormat;
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
