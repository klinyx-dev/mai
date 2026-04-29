import { type WeeklyLayout } from "@mai/mai-web-core";
import type { PropType } from "vue";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  MaiActionRunner,
  MaiBoardInteractiveActionConfig,
  MaiBoardInteractiveActorConfig,
  MaiBoardInteractiveViewConfig,
  MaiInteractionErrorPayload,
  MaiViewFilter,
  MaiViewFilterOption,
  SlotActionEventPayload,
  SlotClickEventPayload,
  SlotRescheduleActionEventPayload,
  TimeLabelFormat,
  WeekShift,
} from "../types";
import type { AnyCommandEnvelope } from "@mai/mai-web-core";

export type PartialViewConfig = Partial<MaiBoardInteractiveViewConfig>;
export type PartialActorConfig = Partial<MaiBoardInteractiveActorConfig>;
export type PartialActionConfig = Partial<MaiBoardInteractiveActionConfig>;

export const maiBoardInteractiveProps = {
  layout: {
    type: Object as PropType<WeeklyLayout | null>,
    required: false,
    default: null,
  },
  anchorDate: {
    type: String,
    required: true,
  },
  isLoading: {
    type: Boolean,
    required: false,
    default: false,
  },
  errorMessage: {
    type: String as PropType<string | null>,
    required: false,
    default: null,
  },

  // Preferred grouped configuration API.
  view: {
    type: Object as PropType<PartialViewConfig | null>,
    required: false,
    default: null,
  },
  actor: {
    type: Object as PropType<PartialActorConfig | null>,
    required: false,
    default: null,
  },
  actions: {
    type: Object as PropType<PartialActionConfig | null>,
    required: false,
    default: null,
  },

  viewFilter: {
    type: Object as PropType<MaiViewFilter | null>,
    required: false,
    default: null,
  },
  viewFilterOptions: {
    type: Array as PropType<MaiViewFilterOption[]>,
    required: false,
    default: () => [],
  },
} as const;

export const maiBoardInteractiveEmits = {
  "navigate-week": (shift: WeekShift) => shift === -1 || shift === 0 || shift === 1,
  "slot-click": (payload: SlotClickEventPayload) => typeof payload.slotId === "string",
  "appointment-click": (payload: AppointmentClickEventPayload) =>
    typeof payload.appointmentId === "string",
  "empty-cell-click": (payload: EmptyCellClickEventPayload) =>
    Number.isInteger(payload.dayIndex),
  "slot-created": (payload: CreateSlotActionEventPayload) => typeof payload.slotId === "string",
  "slot-rescheduled": (payload: SlotRescheduleActionEventPayload) =>
    typeof payload.slotId === "string",
  "slot-booked": (payload: SlotActionEventPayload) => typeof payload.slotId === "string",
  "slot-cancelled": (payload: SlotActionEventPayload) => typeof payload.slotId === "string",
  "slot-deleted": (payload: SlotActionEventPayload) => typeof payload.slotId === "string",
  "appointment-cancelled": (payload: AppointmentActionEventPayload) =>
    typeof payload.appointmentId === "string",
  "appointment-deleted": (payload: AppointmentActionEventPayload) =>
    typeof payload.appointmentId === "string",
  "view-filter-change": (payload: MaiViewFilter) =>
    typeof payload.mode === "string" && Array.isArray(payload.ids),
  "interaction-error": (payload: MaiInteractionErrorPayload) =>
    typeof payload.action === "string" && typeof payload.message === "string",
} as const;
