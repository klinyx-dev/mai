import { computed, defineComponent, h, type PropType } from "vue";
import type { WeeklyLayout } from "@mai/mai-web-core";
import type {
  AppointmentClickEventPayload,
  EmptyCellClickEventPayload,
  SlotClickEventPayload,
  TimeLabelFormat,
  WeekShift,
} from "./contracts";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VISIBLE_START_MINUTE = 8 * 60;
const VISIBLE_END_MINUTE = 20 * 60;
const TOTAL_VISIBLE_MINUTES = VISIBLE_END_MINUTE - VISIBLE_START_MINUTE;

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

interface CalendarEvent {
  id: string;
  kind: "slot" | "appointment";
  dayIndex: number;
  startMinute: number;
  endMinute: number;
}

function minuteLabel(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function dateFromIso(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function isoFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeekIso(anchorDate: string): string {
  const date = dateFromIso(anchorDate);
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + offset);
  return isoFromDate(date);
}

function addDaysIso(isoDate: string, days: number): string {
  const date = dateFromIso(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return isoFromDate(date);
}

function monthDayLabel(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    dateFromIso(isoDate)
  );
}

function weekdayLabel(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(
    dateFromIso(isoDate)
  );
}

function weekRangeLabel(weekStartIso: string, weekEndIso: string): string {
  const start = dateFromIso(weekStartIso);
  const end = dateFromIso(weekEndIso);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const startLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: start.getUTCFullYear() === end.getUTCFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  }).format(end);
  return `${startLabel} - ${endLabel}`;
}

function clampToVisibleRange(startMinute: number, endMinute: number): { start: number; end: number } {
  const start = Math.max(startMinute, VISIBLE_START_MINUTE);
  const end = Math.min(endMinute, VISIBLE_END_MINUTE);
  return { start, end };
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

    const hourTicks = computed(() => {
      const ticks: number[] = [];
      for (let minute = VISIBLE_START_MINUTE; minute <= VISIBLE_END_MINUTE; minute += 60) {
        ticks.push(minute);
      }
      return ticks;
    });

    const dayDates = computed(() =>
      DAY_LABELS.map((_, dayIndex) => addDaysIso(weekStartIso.value, dayIndex))
    );

    const calendarEvents = computed(() => {
      if (!props.layout) {
        return [] as CalendarEvent[];
      }
      const slotEvents: CalendarEvent[] = props.layout.slots.map((slot) => ({
        id: slot.slot_id,
        kind: "slot",
        dayIndex: slot.day_index,
        startMinute: slot.start_minute,
        endMinute: slot.end_minute,
      }));
      const appointmentEvents: CalendarEvent[] = props.layout.appointments.map((appointment) => ({
        id: appointment.appointment_id,
        kind: "appointment",
        dayIndex: appointment.day_index,
        startMinute: appointment.start_minute,
        endMinute: appointment.end_minute,
      }));
      return [...slotEvents, ...appointmentEvents];
    });

    const dayColumns = computed(() =>
      DAY_LABELS.map((_, dayIndex) => ({
        dayIndex,
        label: weekdayLabel(dayDates.value[dayIndex]),
        dateLabel: monthDayLabel(dayDates.value[dayIndex]),
        events: calendarEvents.value
          .filter((event) => event.dayIndex === dayIndex)
          .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute),
      }))
    );

    return () => (
      <section class="mai-board mai-board__panel">
        <header class="mai-board__header">
          <div class="mai-board__heading-block">
            <p class="mai-board__kicker">Doctor workspace</p>
            <h2 class="mai-board__title">{props.title}</h2>
            <p class="mai-board__subtitle">{props.subtitle}</p>
          </div>
          <div class="mai-board__toolbar">
            <div class="mai-board__navigation">
              <button type="button" class="mai-board__nav-button" onClick={() => emit("navigate-week", -1)}>
                Prev
              </button>
              <button
                type="button"
                class="mai-board__nav-button mai-board__nav-button--today"
                onClick={() => emit("navigate-week", 0)}
              >
                Today
              </button>
              <button type="button" class="mai-board__nav-button" onClick={() => emit("navigate-week", 1)}>
                Next
              </button>
            </div>
            <p class="mai-board__range-label">{weekLabel.value}</p>
            <div class="mai-board__metrics">
              <span class="mai-board__metric">{slotCount.value} slots</span>
              <span class="mai-board__metric mai-board__metric--soft">
                {appointmentCount.value} appointments
              </span>
              {props.isLoading ? <span class="mai-board__metric mai-board__metric--soft">Loading…</span> : null}
            </div>
          </div>
        </header>

        {props.errorMessage ? <p class="mai-board__error">{props.errorMessage}</p> : null}

        <div class="mai-board__calendar-scroll">
          <div class="mai-board__calendar">
            <div class="mai-board__time-column">
              <div class="mai-board__time-column-header">Time</div>
              <div class="mai-board__time-grid">
                {hourTicks.value.map((tick) => (
                  <div class="mai-board__time-label" key={`tick-${tick}`}>
                    {minuteLabel(tick)}
                  </div>
                ))}
              </div>
            </div>

            {dayColumns.value.map((column) => (
              <article class="mai-board__day-column" key={column.dayIndex}>
                <header class="mai-board__day-header">
                  <p class="mai-board__day-label">{column.label}</p>
                  <p class="mai-board__day-date">{column.dateLabel}</p>
                </header>
                <div class="mai-board__day-grid">
                  {hourTicks.value.map((tick) => (
                    <div class="mai-board__hour-line" key={`hour-${column.dayIndex}-${tick}`}></div>
                  ))}
                  {column.events.map((event) => {
                    const clamped = clampToVisibleRange(event.startMinute, event.endMinute);
                    const span = Math.max(clamped.end - clamped.start, 20);
                    const top = ((clamped.start - VISIBLE_START_MINUTE) / TOTAL_VISIBLE_MINUTES) * 100;
                    const height = (span / TOTAL_VISIBLE_MINUTES) * 100;

                    return (
                      <div
                        class={`mai-board__event mai-board__event--${event.kind}`}
                        key={`${event.kind}-${event.id}`}
                        style={{ top: `${top}%`, height: `${height}%` }}
                      >
                        <p class="mai-board__event-title">
                          {event.kind === "slot" ? "Available slot" : "Appointment"}
                        </p>
                        <p class="mai-board__event-time">
                          {minuteLabel(event.startMinute)}-{minuteLabel(event.endMinute)}
                        </p>
                      </div>
                    );
                  })}
                  {column.events.length === 0 ? (
                    <p class="mai-board__empty">{props.emptyStateText}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  },
});
