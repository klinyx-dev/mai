import { defineComponent, h, type PropType } from "vue";
import { MaiEventCard } from "./MaiEventCard";
import { MaiDraftEventCard } from "./day-column/MaiDraftEventCard";
import type { DayColumn } from "../model/view-model";
import { clampToVisibleRange } from "../model/view-model";
import { MIN_SLOT_SPAN_MINUTES } from "../model/slot-gesture";
import {
  toAppointmentClickPayload,
  toEmptyCellClickPayload,
  toSlotClickPayload,
} from "../model/interaction";
import type {
  AppointmentClickEventPayload,
  EmptyCellClickEventPayload,
  InteractionAnchorRect,
  SlotDraftPreview,
  SlotClickEventPayload,
  SlotRescheduleActionEventPayload,
} from "../../types";

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
    onSlotReschedule: {
      type: Function as PropType<(payload: SlotRescheduleActionEventPayload) => void>,
      required: false,
      default: null,
    },
    previewSlotDraft: {
      type: null as unknown as PropType<SlotDraftPreview | null>,
      required: false,
      default: null,
    },
  },
  setup(props) {
    const tickCount = Math.max(props.hourTicks.length - 1, 1);

    function computePosition(startMinute: number, endMinute: number) {
      const clamped = clampToVisibleRange(
        startMinute,
        endMinute,
        props.visibleStartMinute,
        props.visibleEndMinute
      );
      if (!clamped) {
        return null;
      }
      const span = Math.max(clamped.end - clamped.start, MIN_SLOT_SPAN_MINUTES);
      const top = ((clamped.start - props.visibleStartMinute) / props.totalVisibleMinutes) * 100;
      const height = (span / props.totalVisibleMinutes) * 100;
      return { top, height };
    }

    function handleEventActivate(
      event: (typeof props.column.events)[number],
      point: { clientX: number; clientY: number },
      anchorRect: InteractionAnchorRect
    ) {
      if (event.kind === "slot") {
        props.onSlotClick(toSlotClickPayload(event, point, anchorRect));
        return;
      }

      props.onAppointmentClick(toAppointmentClickPayload(event, point, anchorRect));
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
          columnRect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
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
            const position = computePosition(event.startMinute, event.endMinute);
            if (!position) {
              return null;
            }

            return (
              <MaiEventCard
                event={event}
                top={position.top}
                height={position.height}
                visibleStartMinute={props.visibleStartMinute}
                totalVisibleMinutes={props.totalVisibleMinutes}
                minuteLabel={props.minuteLabel}
                onActivate={handleEventActivate}
                onSlotReschedule={props.onSlotReschedule}
                key={`${event.kind}-${event.id}`}
              />
            );
          })}
          {props.previewSlotDraft &&
          props.previewSlotDraft.dayIndex === props.column.dayIndex ? (() => {
            const position = computePosition(
              props.previewSlotDraft.startMinute,
              props.previewSlotDraft.endMinute
            );
            if (!position) {
              return null;
            }
            return (
              <MaiDraftEventCard
                top={position.top}
                height={position.height}
                startMinute={props.previewSlotDraft.startMinute}
                endMinute={props.previewSlotDraft.endMinute}
                minuteLabel={props.minuteLabel}
              />
            );
          })() : null}
          {props.column.events.length === 0 ? (
            <p class="mai-board__empty">{props.emptyStateText}</p>
          ) : null}
        </div>
      </article>
    );
  },
});
