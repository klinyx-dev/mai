import type { WeeklyLayout } from "@mai/mai-web-core";
import type { ExtractPropTypes, PropType } from "vue";
import type { SlotDraftPreview, TimeLabelFormat } from "../../../../types";
import { isMinuteRange } from "./validators";

export const maiBoardProps = {
  layout: {
    type: Object as () => WeeklyLayout | null,
    required: false,
    default: null,
  },
  title: {
    type: String,
    required: false,
    default: "Availability",
  },
  subtitle: {
    type: String,
    required: false,
    default: "Weekly planning",
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
  visibleStartMinute: {
    type: Number,
    required: false,
    default: 0,
    validator: (value: unknown) => isMinuteRange(value),
  },
  visibleEndMinute: {
    type: Number,
    required: false,
    default: 1440,
    validator: (value: unknown) => isMinuteRange(value),
  },
  timeLabelFormat: {
    type: String as PropType<TimeLabelFormat>,
    required: false,
    default: "24h",
    validator: (value: unknown) => value === "24h" || value === "12h",
  },
  emptyStateText: {
    type: String,
    required: false,
    default: "No events",
  },
  actionResourceOwnerId: {
    type: String,
    required: false,
    default: "",
  },
  actionCreatedBy: {
    type: String,
    required: false,
    default: "",
  },
  actionBusy: {
    type: Boolean,
    required: false,
    default: false,
  },
  defaultSlotDurationMinutes: {
    type: Number,
    required: false,
    default: 30,
  },
  showActionOverlay: {
    type: Boolean,
    required: false,
    default: true,
  },
  previewSlotDraft: {
    type: null as unknown as PropType<SlotDraftPreview | null>,
    required: false,
    default: null,
  },
};

export type MaiBoardProps = Readonly<ExtractPropTypes<typeof maiBoardProps>>;
