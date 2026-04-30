import { type WeeklyLayout } from "@mai/mai-web-core";
import type { PropType } from "vue";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  MaiBoardInteractiveActionConfig,
  MaiBoardInteractiveActorConfig,
  MaiBoardInteractiveViewConfig,
  MaiInteractionErrorPayload,
  MaiViewFilter,
  MaiViewFilterOption,
  SlotActionEventPayload,
  SlotClickEventPayload,
  SlotRescheduleActionEventPayload,
  WeekShift,
} from "../types";
import { MAI_BOARD_INTERACTIVE_EVENTS } from "../types/interactive";

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
  [MAI_BOARD_INTERACTIVE_EVENTS.NAVIGATE_WEEK]: (shift: WeekShift) =>
    shift === -1 || shift === 0 || shift === 1,
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_CLICK]: (payload: SlotClickEventPayload) =>
    typeof payload.slotId === "string",
  [MAI_BOARD_INTERACTIVE_EVENTS.APPOINTMENT_CLICK]: (payload: AppointmentClickEventPayload) =>
    typeof payload.appointmentId === "string",
  [MAI_BOARD_INTERACTIVE_EVENTS.EMPTY_CELL_CLICK]: (payload: EmptyCellClickEventPayload) =>
    Number.isInteger(payload.dayIndex),
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_CREATED]: (payload: CreateSlotActionEventPayload) =>
    typeof payload.slotId === "string",
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_RESCHEDULED]: (payload: SlotRescheduleActionEventPayload) =>
    typeof payload.slotId === "string",
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_BOOKED]: (payload: SlotActionEventPayload) =>
    typeof payload.slotId === "string",
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_CANCELLED]: (payload: SlotActionEventPayload) =>
    typeof payload.slotId === "string",
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_DELETED]: (payload: SlotActionEventPayload) =>
    typeof payload.slotId === "string",
  [MAI_BOARD_INTERACTIVE_EVENTS.APPOINTMENT_CANCELLED]: (payload: AppointmentActionEventPayload) =>
    typeof payload.appointmentId === "string",
  [MAI_BOARD_INTERACTIVE_EVENTS.APPOINTMENT_DELETED]: (payload: AppointmentActionEventPayload) =>
    typeof payload.appointmentId === "string",
  [MAI_BOARD_INTERACTIVE_EVENTS.VIEW_FILTER_CHANGE]: (payload: MaiViewFilter) =>
    typeof payload.mode === "string" && Array.isArray(payload.ids),
  [MAI_BOARD_INTERACTIVE_EVENTS.INTERACTION_ERROR]: (payload: MaiInteractionErrorPayload) =>
    typeof payload.action === "string" && typeof payload.message === "string",
} as const;
