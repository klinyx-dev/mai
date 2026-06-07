import { defineComponent, h, ref, watch, type PropType } from "vue";
import type {
  CreateBlackoutActionEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
} from "../../../types";
import { INTERACTION_ACTIONS } from "../../../types/interactive";
import {
  type ActionButtonModel,
  MAI_ACTION_BUTTON_TONES,
  MaiActionButtons,
  MaiActionCard,
  MaiActionDetailList,
} from "../../../shared/ui/action-card/MaiActionCard";
import { actionDayLabel, actionTimeRangeLabel } from "./display";
import {
  buildCreateSlotPayloadFromRange,
  buildCreateBlackoutPayloadFromRange,
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
    enableBlackout: {
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
    [INTERACTION_ACTIONS.CREATE_BLACKOUT]: (payload: CreateBlackoutActionEventPayload) =>
      typeof payload.blackoutId === "string" &&
      typeof payload.startIso === "string" &&
      typeof payload.endIso === "string" &&
      typeof payload.resourceOwnerId === "string" &&
      typeof payload.reason === "string" &&
      typeof payload.createdBy === "string",
    close: () => true,
  },
  setup(props, { emit }) {
    const startTimeLabel = ref("00:00");
    const endTimeLabel = ref("00:00");
    const capacity = ref(1);
    const blackoutReason = ref("Unavailable");

    function draftStartMinute(): number {
      return typeof props.draft.startMinute === "number"
        ? props.draft.startMinute
        : props.draft.minuteOfDay;
    }

    function draftEndMinute(): number {
      const safeDuration = clampSlotDurationMinutes(props.defaultDurationMinutes);
      return typeof props.draft.endMinute === "number"
        ? props.draft.endMinute
        : draftStartMinute() + safeDuration;
    }

    function resetDraftTimeFields() {
      startTimeLabel.value = timeLabelFromMinuteOfDay(draftStartMinute());
      endTimeLabel.value = timeLabelFromMinuteOfDay(draftEndMinute());
    }

    function editedStartMinute(): number {
      return minuteOfDayFromTimeLabel(startTimeLabel.value) ?? draftStartMinute();
    }

    function editedEndMinute(): number {
      return minuteOfDayFromTimeLabel(endTimeLabel.value) ?? draftEndMinute();
    }

    function actionButtons(): ActionButtonModel[] {
      return [
        {
          key: INTERACTION_ACTIONS.CREATE_SLOT,
          label: "Create slot",
          tone: MAI_ACTION_BUTTON_TONES.PRIMARY,
          disabled: props.busy,
          onClick: () => emit(INTERACTION_ACTIONS.CREATE_SLOT, createPayload()),
        },
        ...(props.enableBlackout
          ? [
              {
                key: INTERACTION_ACTIONS.CREATE_BLACKOUT,
                label: "Create blackout",
                disabled: props.busy,
                onClick: () =>
                  emit(INTERACTION_ACTIONS.CREATE_BLACKOUT, createBlackoutPayload()),
              },
            ]
          : []),
      ];
    }

    function selectedTimeRangeLabel(): string {
      const startMinute =
        minuteOfDayFromTimeLabel(startTimeLabel.value) ?? draftStartMinute();
      const endMinute = minuteOfDayFromTimeLabel(endTimeLabel.value) ?? draftEndMinute();
      return actionTimeRangeLabel(startMinute, endMinute);
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
      return buildCreateSlotPayloadFromRange({
        weekStartIso: props.weekStartIso,
        dayIndex: props.draft.dayIndex,
        startMinute: editedStartMinute(),
        endMinute: editedEndMinute(),
        resourceOwnerId: props.resourceOwnerId,
        createdBy: props.createdBy,
        capacity: Math.max(1, Math.round(capacity.value || 1)),
      });
    };

    const createBlackoutPayload = () => {
      return buildCreateBlackoutPayloadFromRange({
        weekStartIso: props.weekStartIso,
        dayIndex: props.draft.dayIndex,
        startMinute: editedStartMinute(),
        endMinute: editedEndMinute(),
        resourceOwnerId: props.resourceOwnerId,
        reason: blackoutReason.value,
        createdBy: props.createdBy,
      });
    };

    return () => (
      <MaiActionCard
        eyebrow="New availability"
        title="Create slot"
        subtitle={`${actionDayLabel(props.draft.dayIndex)} - ${selectedTimeRangeLabel()}`}
        closeAriaLabel="Close create slot"
        onClose={() => emit("close")}
      >
        <MaiActionDetailList
          details={[
            { label: "Resource owner", value: props.resourceOwnerId },
            { label: "Created by", value: props.createdBy },
          ]}
        />
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
          <label class="mai-action-field">
            <span class="mai-action-field__label">Capacity</span>
            <input
              class="mai-action-input"
              type="number"
              min={1}
              step={1}
              value={capacity.value}
              onInput={(event) => {
                const next = Number((event.target as HTMLInputElement).value);
                capacity.value = Number.isFinite(next)
                  ? Math.max(1, Math.round(next))
                  : 1;
              }}
            />
          </label>
          {props.enableBlackout ? (
            <label class="mai-action-field mai-action-field--full">
              <span class="mai-action-field__label">Blackout reason</span>
              <input
                class="mai-action-input"
                type="text"
                value={blackoutReason.value}
                onInput={(event) => {
                  blackoutReason.value = (event.target as HTMLInputElement).value;
                }}
              />
            </label>
          ) : null}
        </div>
        <MaiActionButtons buttons={actionButtons()} />
      </MaiActionCard>
    );
  },
});
