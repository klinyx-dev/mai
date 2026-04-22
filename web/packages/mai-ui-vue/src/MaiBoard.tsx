import { computed, defineComponent, h, type PropType } from "vue";
import type { WeeklyLayout } from "@mai/mai-web-core";
import type {
  AppointmentClickEventPayload,
  EmptyCellClickEventPayload,
  SlotClickEventPayload,
  TimeLabelFormat,
  WeekShift,
} from "./contracts";
import { MaiDayColumn } from "./board/MaiDayColumn";
import { MaiTimeGutter } from "./board/MaiTimeGutter";
import { MaiWeekHeader } from "./board/MaiWeekHeader";
import {
  addDaysIso,
  buildDayColumns,
  createHourTicks,
  DEFAULT_TOTAL_VISIBLE_MINUTES,
  DEFAULT_VISIBLE_END_MINUTE,
  DEFAULT_VISIBLE_START_MINUTE,
  mapCalendarEvents,
  minuteLabel,
  startOfWeekIso,
  weekRangeLabel,
} from "./board/view-model";

function isMinuteRange(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 1440
  );
}

function isSlotClickPayload(value: unknown): value is SlotClickEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.slotId === "string" &&
    Number.isInteger(payload.dayIndex) &&
    typeof payload.startMinute === "number" &&
    typeof payload.endMinute === "number"
  );
}

function isAppointmentClickPayload(value: unknown): value is AppointmentClickEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.appointmentId === "string" &&
    typeof payload.slotId === "string" &&
    Number.isInteger(payload.dayIndex) &&
    typeof payload.startMinute === "number" &&
    typeof payload.endMinute === "number"
  );
}

function isEmptyCellClickPayload(value: unknown): value is EmptyCellClickEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return Number.isInteger(payload.dayIndex) && typeof payload.minuteOfDay === "number";
}

export const MaiBoard = defineComponent({
  name: "MaiBoard",
  emits: {
    "navigate-week": (shift: WeekShift) => shift === -1 || shift === 0 || shift === 1,
    "slot-click": (payload: SlotClickEventPayload) => isSlotClickPayload(payload),
    "appointment-click": (payload: AppointmentClickEventPayload) =>
      isAppointmentClickPayload(payload),
    "empty-cell-click": (payload: EmptyCellClickEventPayload) =>
      isEmptyCellClickPayload(payload),
  },
  props: {
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
      default: "Weekly clinical planning",
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
  },
  setup(props, { emit }) {
    const slotCount = computed(() => props.layout?.slots.length ?? 0);
    const appointmentCount = computed(() => props.layout?.appointments.length ?? 0);
    const weekStartIso = computed(() => props.layout?.week_start ?? startOfWeekIso(props.anchorDate));
    const weekEndIso = computed(() => props.layout?.week_end ?? addDaysIso(weekStartIso.value, 6));
    const weekLabel = computed(() => weekRangeLabel(weekStartIso.value, weekEndIso.value));

    const hourTicks = computed(() =>
      createHourTicks(DEFAULT_VISIBLE_START_MINUTE, DEFAULT_VISIBLE_END_MINUTE)
    );
    const totalVisibleMinutes = computed(() => DEFAULT_TOTAL_VISIBLE_MINUTES);

    const calendarEvents = computed(() => mapCalendarEvents(props.layout));
    const dayColumns = computed(() =>
      buildDayColumns(weekStartIso.value, calendarEvents.value)
    );

    return () => (
      <section class="mai-board mai-board__panel">
        <MaiWeekHeader
          title={props.title}
          subtitle={props.subtitle}
          weekLabel={weekLabel.value}
          slotCount={slotCount.value}
          appointmentCount={appointmentCount.value}
          isLoading={props.isLoading}
          onNavigateWeek={(shift: WeekShift) => emit("navigate-week", shift)}
        />

        {props.errorMessage ? <p class="mai-board__error">{props.errorMessage}</p> : null}

        <div class="mai-board__calendar-scroll">
          <div class="mai-board__calendar">
            <MaiTimeGutter hourTicks={hourTicks.value} minuteLabel={minuteLabel} />
            {dayColumns.value.map((column) => (
              <MaiDayColumn
                column={column}
                hourTicks={hourTicks.value}
                emptyStateText={props.emptyStateText}
                minuteLabel={minuteLabel}
                visibleStartMinute={DEFAULT_VISIBLE_START_MINUTE}
                visibleEndMinute={DEFAULT_VISIBLE_END_MINUTE}
                totalVisibleMinutes={totalVisibleMinutes.value}
                key={column.dayIndex}
              />
            ))}
          </div>
        </div>
      </section>
    );
  },
});
