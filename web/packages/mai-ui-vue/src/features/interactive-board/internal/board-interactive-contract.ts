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
} from "../../../types";
import { MAI_BOARD_INTERACTIVE_EVENTS } from "../../../types/interactive";
import {
  isAppointmentActionPayload,
  isAppointmentClickPayload,
  isCreateSlotPayload,
  isEmptyCellClickPayload,
  isMaiInteractionErrorPayload,
  isMaiViewFilter,
  isSlotActionPayload,
  isSlotClickPayload,
  isSlotReschedulePayload,
  isWeekShift,
} from "../../../validators/events";

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
  [MAI_BOARD_INTERACTIVE_EVENTS.NAVIGATE_WEEK]: (shift: WeekShift) => isWeekShift(shift),
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_CLICK]: (payload: SlotClickEventPayload) =>
    isSlotClickPayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.APPOINTMENT_CLICK]: (payload: AppointmentClickEventPayload) =>
    isAppointmentClickPayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.EMPTY_CELL_CLICK]: (payload: EmptyCellClickEventPayload) =>
    isEmptyCellClickPayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_CREATED]: (payload: CreateSlotActionEventPayload) =>
    isCreateSlotPayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_RESCHEDULED]: (payload: SlotRescheduleActionEventPayload) =>
    isSlotReschedulePayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_BOOKED]: (payload: SlotActionEventPayload) =>
    isSlotActionPayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_CANCELLED]: (payload: SlotActionEventPayload) =>
    isSlotActionPayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.SLOT_DELETED]: (payload: SlotActionEventPayload) =>
    isSlotActionPayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.APPOINTMENT_CANCELLED]: (payload: AppointmentActionEventPayload) =>
    isAppointmentActionPayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.APPOINTMENT_DELETED]: (payload: AppointmentActionEventPayload) =>
    isAppointmentActionPayload(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.VIEW_FILTER_CHANGE]: (payload: MaiViewFilter) =>
    isMaiViewFilter(payload),
  [MAI_BOARD_INTERACTIVE_EVENTS.INTERACTION_ERROR]: (payload: MaiInteractionErrorPayload) =>
    isMaiInteractionErrorPayload(payload),
} as const;
