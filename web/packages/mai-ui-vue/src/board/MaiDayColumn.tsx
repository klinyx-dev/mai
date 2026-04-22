import { defineComponent, h, type PropType } from "vue";
import { MaiEventCard } from "./MaiEventCard";
import type { DayColumn } from "./view-model";
import { clampToVisibleRange } from "./view-model";
import type {
  AppointmentClickEventPayload,
  EmptyCellClickEventPayload,
  SlotClickEventPayload,
} from "../contracts";

export const MaiDayColumn = defineComponent({
  name: "MaiDayColumn",
  props: {
    column: { type: Object as PropType<DayColumn>, required: true },
    hourTicks: { type: Array as PropType<number[]>, required: true },
    emptyStateText: { type: String, required: true },
    minuteLabel: { type: Function as PropType<(value: number) => string>, required: true },
    visibleStartMinute: { type: Number, required: true },
    visibleEndMinute: { type: Number, required: true },
    totalVisibleMinutes: { type: Number, required: true },
    onSlotClick: {
      type: Function as PropType<(payload: SlotClickEventPayload) => void>,
      required: true,
    },
    onAppointmentClick: {
      type: Function as PropType<(payload: AppointmentClickEventPayload) => void>,
      required: true,
    },
    onEmptyCellClick: {
      type: Function as PropType<(payload: EmptyCellClickEventPayload) => void>,
      required: true,
    },
  },
  setup(props) {
    const slotHeight = `${100 / Math.max(props.hourTicks.length - 1, 1)}%`;

    function handleEventActivate(event: (typeof props.column.events)[number]) {
      if (event.kind === "slot") {
        props.onSlotClick({
          slotId: event.slotId,
          dayIndex: event.dayIndex,
          startMinute: event.startMinute,
          endMinute: event.endMinute,
        });
        return;
      }

      props.onAppointmentClick({
        appointmentId: event.id,
        slotId: event.slotId,
        dayIndex: event.dayIndex,
        startMinute: event.startMinute,
        endMinute: event.endMinute,
      });
    }

    function handleGridClick(event: MouseEvent) {
      const grid = event.currentTarget as HTMLElement | null;
      if (!grid) {
        return;
      }
      const rect = grid.getBoundingClientRect();
      const relativeY = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
      const ratio = rect.height > 0 ? relativeY / rect.height : 0;
      const minute = Math.round(
        props.visibleStartMinute + ratio * props.totalVisibleMinutes
      );
      const clampedMinute = Math.min(Math.max(minute, 0), 1440);

      props.onEmptyCellClick({
        dayIndex: props.column.dayIndex,
        minuteOfDay: clampedMinute,
      });
    }

    return () => (
      <article class="mai-board__day-column">
        <header class="mai-board__day-header">
          <p class="mai-board__day-label">{props.column.label}</p>
          <p class="mai-board__day-date">{props.column.dateLabel}</p>
        </header>
        <div class="mai-board__day-grid" onClick={handleGridClick}>
          {props.hourTicks.map((tick) => (
            <div
              class="mai-board__hour-line"
              key={`hour-${props.column.dayIndex}-${tick}`}
              style={{ height: slotHeight }}
            ></div>
          ))}
          {props.column.events.map((event) => {
            const clamped = clampToVisibleRange(
              event.startMinute,
              event.endMinute,
              props.visibleStartMinute,
              props.visibleEndMinute
            );
            const span = Math.max(clamped.end - clamped.start, 20);
            const top =
              ((clamped.start - props.visibleStartMinute) / props.totalVisibleMinutes) * 100;
            const height = (span / props.totalVisibleMinutes) * 100;

            return (
              <MaiEventCard
                event={event}
                top={top}
                height={height}
                minuteLabel={props.minuteLabel}
                onActivate={handleEventActivate}
                key={`${event.kind}-${event.id}`}
              />
            );
          })}
          {props.column.events.length === 0 ? (
            <p class="mai-board__empty">{props.emptyStateText}</p>
          ) : null}
        </div>
      </article>
    );
  },
});
