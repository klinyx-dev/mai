import { defineComponent, h, ref, watch, type PropType } from "vue";
import type { CreateSlotActionEventPayload, EmptyCellClickEventPayload } from "./contracts";

function isoFromDate(date: Date): string {
  return date.toISOString();
}

function dateFromWeekPoint(
  weekStartIso: string,
  dayIndex: number,
  minuteOfDay: number
): Date {
  const base = new Date(`${weekStartIso}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dayIndex);
  base.setUTCMinutes(minuteOfDay, 0, 0);
  return base;
}

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

    function createPayload(): CreateSlotActionEventPayload {
      const safeDuration = Math.max(15, Math.min(durationMinutes.value, 180));
      const start = dateFromWeekPoint(
        props.weekStartIso,
        props.draft.dayIndex,
        props.draft.minuteOfDay
      );
      const end = new Date(start.getTime() + safeDuration * 60 * 1000);
      return {
        slotId: `slot-${Date.now()}`,
        startIso: isoFromDate(start),
        endIso: isoFromDate(end),
        assigneeId: props.assigneeId,
        createdBy: props.createdBy,
      };
    }

    return () => (
      <section class="mai-action-card">
        <header class="mai-action-card__header">
          <h3 class="mai-action-card__title">Create Slot</h3>
          <button
            type="button"
            class="mai-action-card__close"
            onClick={() => emit("close")}
            aria-label="Close create slot"
          >
            x
          </button>
        </header>
        <p class="mai-action-card__meta">
          day {props.draft.dayIndex} - minute {props.draft.minuteOfDay}
        </p>
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
        <div class="mai-action-card__actions">
          <button
            type="button"
            class="mai-action-button mai-action-button--primary"
            disabled={props.busy}
            onClick={() => emit("create-slot", createPayload())}
          >
            Create Slot
          </button>
        </div>
      </section>
    );
  },
});
