import { defineComponent, h, ref, watch, type PropType } from "vue";
import type {
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
} from "../types";
import { INTERACTION_ACTIONS } from "../types/interactive";
import { MaiActionButtons, MaiActionCard, MaiActionMetaList } from "./MaiActionCard";
import {
  buildCreateSlotPayloadFromRange,
  clampSlotDurationMinutes,
  minuteOfDayFromTimeLabel,
  timeLabelFromMinuteOfDay,
} from "./payload";

export const MaiCreateSlotCard = defineComponent({
  name: "MaiCreateSlotCard",
  props: {
    draft: {
      type: Object as PropType<EmptyCellClickEventPayload>,
      required: true,
    },
    weekStartIso: {
      type: String,
      required: true,
    },
    resourceOwnerId: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    defaultDurationMinutes: {
      type: Number,
      required: false,
      default: 30,
    },
    busy: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: {
    [INTERACTION_ACTIONS.CREATE_SLOT]: (payload: CreateSlotActionEventPayload) =>
      typeof payload.slotId === "string" &&
      typeof payload.startIso === "string" &&
      typeof payload.endIso === "string" &&
      typeof payload.resourceOwnerId === "string" &&
      typeof payload.createdBy === "string",
    close: () => true,
  },
  setup(props, { emit }) {
    const startTimeLabel = ref("00:00");
    const endTimeLabel = ref("00:00");

    function resetDraftTimeFields() {
      const safeDuration = clampSlotDurationMinutes(props.defaultDurationMinutes);
      const startMinute =
        typeof props.draft.startMinute === "number"
          ? props.draft.startMinute
          : props.draft.minuteOfDay;
      const endMinute =
        typeof props.draft.endMinute === "number"
          ? props.draft.endMinute
          : startMinute + safeDuration;
      startTimeLabel.value = timeLabelFromMinuteOfDay(startMinute);
      endTimeLabel.value = timeLabelFromMinuteOfDay(endMinute);
    }

    watch(
      () => [
        props.draft.dayIndex,
        props.draft.minuteOfDay,
        props.draft.startMinute,
        props.draft.endMinute,
      ],
      () => resetDraftTimeFields(),
      { immediate: true }
    );

    const createPayload = () => {
      const parsedStartMinute = minuteOfDayFromTimeLabel(startTimeLabel.value);
      const parsedEndMinute = minuteOfDayFromTimeLabel(endTimeLabel.value);
      const fallbackDuration = clampSlotDurationMinutes(props.defaultDurationMinutes);
      const fallbackStart =
        typeof props.draft.startMinute === "number"
          ? props.draft.startMinute
          : props.draft.minuteOfDay;
      const fallbackEnd =
        typeof props.draft.endMinute === "number"
          ? props.draft.endMinute
          : fallbackStart + fallbackDuration;

      return buildCreateSlotPayloadFromRange({
        weekStartIso: props.weekStartIso,
        dayIndex: props.draft.dayIndex,
        startMinute: parsedStartMinute ?? fallbackStart,
        endMinute: parsedEndMinute ?? fallbackEnd,
        resourceOwnerId: props.resourceOwnerId,
        createdBy: props.createdBy,
      });
    };

    return () =>
      h(
        MaiActionCard,
        {
          title: "Create Slot",
          closeAriaLabel: "Close create slot",
          onClose: () => emit("close"),
        },
        {
          default: () => [
            h(MaiActionMetaList, {
              lines: [`day ${props.draft.dayIndex} - minute ${props.draft.minuteOfDay}`],
            }),
            <div class="mai-action-field-grid">
              <label class="mai-action-field">
                <span class="mai-action-field__label">Start</span>
                <input
                  class="mai-action-input"
                  type="time"
                  step={60}
                  value={startTimeLabel.value}
                  onInput={(event) => {
                    startTimeLabel.value = (event.target as HTMLInputElement).value;
                  }}
                />
              </label>
              <label class="mai-action-field">
                <span class="mai-action-field__label">End</span>
                <input
                  class="mai-action-input"
                  type="time"
                  step={60}
                  value={endTimeLabel.value}
                  onInput={(event) => {
                    endTimeLabel.value = (event.target as HTMLInputElement).value;
                  }}
                />
              </label>
            </div>,
            h(MaiActionButtons, {
              buttons: [
                {
                  key: INTERACTION_ACTIONS.CREATE_SLOT,
                  label: "Create Slot",
                  tone: "primary",
                  disabled: props.busy,
                  onClick: () => emit(INTERACTION_ACTIONS.CREATE_SLOT, createPayload()),
                },
              ],
            }),
          ],
        }
      );
  },
});
