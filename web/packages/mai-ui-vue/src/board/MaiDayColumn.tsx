import { defineComponent, h, type PropType } from "vue";
import { MaiEventCard } from "./MaiEventCard";
import type { DayColumn } from "./view-model";
import { clampToVisibleRange } from "./view-model";
import {
  toAppointmentClickPayload,
  toEmptyCellClickPayload,
  toSlotClickPayload,
} from "./interaction";
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
    const tickCount = Math.max(props.hourTicks.length - 1, 1);

    function handleEventActivate(
      event: (typeof props.column.events)[number],
      point: { clientX: number; clientY: number }
    ) {
      if (event.kind === "slot") {
        props.onSlotClick(toSlotClickPayload(event, point));
        return;
      }

      props.onAppointmentClick(toAppointmentClickPayload(event, point));
    }

    function handleGridClick(event: MouseEvent) {
      const grid = event.currentTarget as HTMLElement | null;
      if (!grid) {
        return;
      }
      const rect = grid.getBoundingClientRect();
      props.onEmptyCellClick(
        toEmptyCellClickPayload({
          dayIndex: props.column.dayIndex,
          clientX: event.clientX,
          clientY: event.clientY,
          top: rect.top,
          height: rect.height,
          visibleStartMinute: props.visibleStartMinute,
          totalVisibleMinutes: props.totalVisibleMinutes,
        })
      );
    }

    return () => (
      <article class="mai-board__day-column">
        <header class="mai-board__day-header">
          <p class="mai-board__day-label">{props.column.label}</p>
          <p class="mai-board__day-date">{props.column.dateLabel}</p>
        </header>
        <div class="mai-board__day-grid" onClick={handleGridClick}>
          {props.hourTicks.map((tick, index) => {
            const top = (index / tickCount) * 100;
            return (
              <div
                class="mai-board__hour-line"
                key={`hour-${props.column.dayIndex}-${tick}`}
                style={{ top: `${top}%` }}
              ></div>
            );
          })}
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
