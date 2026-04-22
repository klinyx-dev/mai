import { defineComponent, h, ref, watch, type PropType } from "vue";
import type {
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
} from "../types";
import { MaiActionButtons, MaiActionCard, MaiActionMetaList } from "./MaiActionCard";
import { buildCreateSlotPayload } from "./payload";

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
    assigneeId: {
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
    "create-slot": (payload: CreateSlotActionEventPayload) =>
      typeof payload.slotId === "string" &&
      typeof payload.startIso === "string" &&
      typeof payload.endIso === "string" &&
      typeof payload.assigneeId === "string" &&
      typeof payload.createdBy === "string",
    close: () => true,
  },
  setup(props, { emit }) {
    const durationMinutes = ref(props.defaultDurationMinutes);

    watch(
      () => props.draft.minuteOfDay,
      () => {
        durationMinutes.value = props.defaultDurationMinutes;
      }
    );

    const createPayload = () =>
      buildCreateSlotPayload({
        weekStartIso: props.weekStartIso,
        dayIndex: props.draft.dayIndex,
        minuteOfDay: props.draft.minuteOfDay,
        durationMinutes: durationMinutes.value,
        assigneeId: props.assigneeId,
        createdBy: props.createdBy,
      });

    return () => (
      <MaiActionCard
        title="Create Slot"
        closeAriaLabel="Close create slot"
        onClose={() => emit("close")}
      >
        <MaiActionMetaList
          lines={[`day ${props.draft.dayIndex} - minute ${props.draft.minuteOfDay}`]}
        />
        <label class="mai-action-field">
          <span class="mai-action-field__label">Duration (minutes)</span>
          <input
            class="mai-action-input"
            type="number"
            min={15}
            max={180}
            step={15}
            value={durationMinutes.value}
            onInput={(event) => {
              const value = Number((event.target as HTMLInputElement).value);
              if (Number.isFinite(value)) {
                durationMinutes.value = value;
              }
            }}
          />
        </label>
        <MaiActionButtons
          buttons={[
            {
              key: "create-slot",
              label: "Create Slot",
              tone: "primary",
              disabled: props.busy,
              onClick: () => emit("create-slot", createPayload()),
            },
          ]}
        />
      </MaiActionCard>
    );
  },
});
