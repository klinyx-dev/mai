import { defineComponent, h, ref, type PropType } from "vue";
import { MaiEventCard } from "./MaiEventCard";
import { MaiDraftEventCard } from "./day-column/MaiDraftEventCard";
import { MaiNowIndicator } from "./MaiNowIndicator";
import type { DayColumn } from "../model/view-model";
import { clampToVisibleRange } from "../model/view-model";
import {
  computeCreateDraftFromBlankDrag,
  MIN_SLOT_SPAN_MINUTES,
} from "../model/slot-gesture";
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
} from "../../../../types";

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
    nowIndicatorTopPercent: {
      type: Number as PropType<number | null>,
      required: false,
      default: null,
    },
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
    const DRAG_ACTIVATION_PX = 4;
    const tickCount = Math.max(props.hourTicks.length - 1, 1);
    const dragDraft = ref<SlotDraftPreview | null>(null);
    const pointerSession = ref<{
      pointerId: number;
      startClientX: number;
      startClientY: number;
      gridRect: DOMRect;
    } | null>(null);
    const dragMoved = ref(false);
    const suppressNextClick = ref(false);

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
      if (suppressNextClick.value) {
        suppressNextClick.value = false;
        return;
      }
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

    function handleGridPointerDown(event: PointerEvent) {
      if (event.button !== 0) {
        return;
      }
      const grid = event.currentTarget as HTMLElement | null;
      if (!grid) {
        return;
      }
      event.preventDefault();
      grid.setPointerCapture(event.pointerId);
      pointerSession.value = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        gridRect: grid.getBoundingClientRect(),
      };
      dragMoved.value = false;
      dragDraft.value = null;
    }

    function handleGridPointerMove(event: PointerEvent) {
      const session = pointerSession.value;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }
      if (
        Math.hypot(
          event.clientX - session.startClientX,
          event.clientY - session.startClientY
        ) < DRAG_ACTIVATION_PX
      ) {
        return;
      }

      dragMoved.value = true;
      const draft = computeCreateDraftFromBlankDrag({
        pointerDownClientY: session.startClientY,
        pointerCurrentClientY: event.clientY,
        columnTop: session.gridRect.top,
        columnHeight: session.gridRect.height,
        visibleStartMinute: props.visibleStartMinute,
        visibleEndMinute: props.visibleEndMinute,
      });
      dragDraft.value = {
        dayIndex: props.column.dayIndex,
        startMinute: draft.startMinute,
        endMinute: draft.endMinute,
      };
    }

    function finishPointerSession() {
      pointerSession.value = null;
      dragMoved.value = false;
      dragDraft.value = null;
    }

    function handleGridPointerEnd(event: PointerEvent) {
      const session = pointerSession.value;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }
      const grid = event.currentTarget as HTMLElement | null;
      if (grid?.hasPointerCapture(event.pointerId)) {
        grid.releasePointerCapture(event.pointerId);
      }

      if (dragMoved.value && dragDraft.value) {
        suppressNextClick.value = true;
        props.onEmptyCellClick(
          toEmptyCellClickPayload({
            dayIndex: props.column.dayIndex,
            clientX: event.clientX,
            clientY: event.clientY,
            top: session.gridRect.top,
            height: session.gridRect.height,
            visibleStartMinute: props.visibleStartMinute,
            totalVisibleMinutes: props.totalVisibleMinutes,
            columnRect: {
              left: session.gridRect.left,
              top: session.gridRect.top,
              width: session.gridRect.width,
              height: session.gridRect.height,
            },
            draftStartMinute: dragDraft.value.startMinute,
            draftEndMinute: dragDraft.value.endMinute,
          })
        );
      }

      finishPointerSession();
    }

    return () => (
      <article
        class={[
          "mai-board__day-column",
          props.column.isToday ? "mai-board__day-column--today" : "",
        ]}
      >
        <header
          class={[
            "mai-board__day-header",
            props.column.isToday ? "mai-board__day-header--today" : "",
          ]}
        >
          <p class="mai-board__day-label">{props.column.label}</p>
          <p
            class={[
              "mai-board__day-date",
              props.column.isToday ? "mai-board__day-date--today" : "",
            ]}
          >
            {props.column.dateLabel}
          </p>
        </header>
        <div
          class="mai-board__day-grid"
          onClick={handleGridClick}
          onPointerdown={handleGridPointerDown}
          onPointermove={handleGridPointerMove}
          onPointerup={handleGridPointerEnd}
          onPointercancel={handleGridPointerEnd}
        >
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
          {typeof props.nowIndicatorTopPercent === "number" ? (
            <MaiNowIndicator topPercent={props.nowIndicatorTopPercent} />
          ) : null}
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
          {(dragDraft.value ??
            (props.previewSlotDraft &&
            props.previewSlotDraft.dayIndex === props.column.dayIndex
              ? props.previewSlotDraft
              : null)) ? (() => {
            const activeDraft =
              dragDraft.value ??
              (props.previewSlotDraft &&
              props.previewSlotDraft.dayIndex === props.column.dayIndex
                ? props.previewSlotDraft
                : null);
            if (!activeDraft) {
              return null;
            }
            const position = computePosition(
              activeDraft.startMinute,
              activeDraft.endMinute
            );
            if (!position) {
              return null;
            }
            return (
              <MaiDraftEventCard
                top={position.top}
                height={position.height}
                startMinute={activeDraft.startMinute}
                endMinute={activeDraft.endMinute}
                minuteLabel={props.minuteLabel}
                dragging={Boolean(dragDraft.value)}
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
