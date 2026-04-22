import { defineComponent, h, type PropType } from "vue";
import { MaiEventCard } from "./MaiEventCard";
import type { DayColumn } from "./view-model";
import { clampToVisibleRange } from "./view-model";

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
  },
  setup(props) {
    const slotHeight = `${100 / Math.max(props.hourTicks.length - 1, 1)}%`;

    return () => (
      <article class="mai-board__day-column">
        <header class="mai-board__day-header">
          <p class="mai-board__day-label">{props.column.label}</p>
          <p class="mai-board__day-date">{props.column.dateLabel}</p>
        </header>
        <div class="mai-board__day-grid">
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
