import { defineComponent, h, type PropType } from "vue";
import type { CalendarEvent } from "../model/view-model";
import type { SlotRescheduleActionEventPayload } from "../../types";
import {
  computeMoveDraft,
  computeResizeBottomDraft,
  computeResizeTopDraft,
  SLOT_SNAP_MINUTES,
} from "../model/slot-gesture";

type DragMode = "move" | "resize-top" | "resize-bottom";

interface DragState {
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  baseDayIndex: number;
  baseStartMinute: number;
  baseEndMinute: number;
  draftDayIndex: number;
  draftStartMinute: number;
  draftEndMinute: number;
  gridHeight: number;
  columnWidth: number;
}

export const MaiEventCard = defineComponent({
  name: "MaiEventCard",
  props: {
    event: { type: Object as PropType<CalendarEvent>, required: true },
    top: { type: Number, required: true },
    height: { type: Number, required: true },
    visibleStartMinute: { type: Number, required: true },
    totalVisibleMinutes: { type: Number, required: true },
    minuteLabel: { type: Function as PropType<(value: number) => string>, required: true },
    onActivate: {
      type: Function as PropType<
        (event: CalendarEvent, point: { clientX: number; clientY: number }) => void
      >,
      required: true,
    },
    onSlotReschedule: {
      type: Function as PropType<(payload: SlotRescheduleActionEventPayload) => void>,
      required: false,
      default: null,
    },
  },
  setup(props) {
    let dragState: DragState | null = null;
    let suppressNextClick = false;

    function centerPointFromTarget(target: EventTarget | null): {
      clientX: number;
      clientY: number;
    } {
      const element = target instanceof HTMLElement ? target : null;
      if (!element) {
        return { clientX: 0, clientY: 0 };
      }
      const rect = element.getBoundingClientRect();
      return {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      };
    }

    function handleActivate(point: { clientX: number; clientY: number }) {
      props.onActivate(props.event, point);
    }

    function computeDraftFromPointer(clientX: number, clientY: number): DragState | null {
      if (!dragState) {
        return null;
      }
      const gesture = {
        deltaClientX: clientX - dragState.startClientX,
        deltaClientY: clientY - dragState.startClientY,
        gridHeight: dragState.gridHeight,
        columnWidth: dragState.columnWidth,
        totalVisibleMinutes: props.totalVisibleMinutes,
      };

      if (dragState.mode === "move") {
        const moveDraft = computeMoveDraft({
          baseDayIndex: dragState.baseDayIndex,
          baseStartMinute: dragState.baseStartMinute,
          baseEndMinute: dragState.baseEndMinute,
          gesture,
        });
        return {
          ...dragState,
          draftDayIndex: moveDraft.dayIndex,
          draftStartMinute: moveDraft.startMinute,
          draftEndMinute: moveDraft.endMinute,
        };
      }

      if (dragState.mode === "resize-top") {
        const resizeDraft = computeResizeTopDraft({
          baseStartMinute: dragState.baseStartMinute,
          baseEndMinute: dragState.baseEndMinute,
          gesture,
        });
        return {
          ...dragState,
          draftStartMinute: resizeDraft.startMinute,
          draftEndMinute: resizeDraft.endMinute,
        };
      }

      const resizeDraft = computeResizeBottomDraft({
        baseStartMinute: dragState.baseStartMinute,
        baseEndMinute: dragState.baseEndMinute,
        gesture,
      });
      return {
        ...dragState,
        draftStartMinute: resizeDraft.startMinute,
        draftEndMinute: resizeDraft.endMinute,
      };
    }

    function commitDragState() {
      if (!dragState || !props.onSlotReschedule || props.event.kind !== "slot") {
        dragState = null;
        return;
      }
      const unchanged =
        dragState.baseDayIndex === dragState.draftDayIndex &&
        dragState.baseStartMinute === dragState.draftStartMinute &&
        dragState.baseEndMinute === dragState.draftEndMinute;
      if (!unchanged) {
        props.onSlotReschedule({
          slotId: props.event.slotId,
          dayIndex: dragState.draftDayIndex,
          startMinute: dragState.draftStartMinute,
          endMinute: dragState.draftEndMinute,
        });
      }
      dragState = null;
    }

    function startDrag(mode: DragMode, event: MouseEvent) {
      if (event.button !== 0) {
        return;
      }
      if (props.event.kind !== "slot") {
        return;
      }
      const card = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
      const dayGrid = card?.parentElement;
      if (!card || !dayGrid) {
        return;
      }
      const gridRect = dayGrid.getBoundingClientRect();
      dragState = {
        mode,
        startClientX: event.clientX,
        startClientY: event.clientY,
        baseDayIndex: props.event.dayIndex,
        baseStartMinute: props.event.startMinute,
        baseEndMinute: props.event.endMinute,
        draftDayIndex: props.event.dayIndex,
        draftStartMinute: props.event.startMinute,
        draftEndMinute: props.event.endMinute,
        gridHeight: gridRect.height,
        columnWidth: gridRect.width,
      };
      suppressNextClick = true;

      const onMove = (moveEvent: MouseEvent) => {
        const next = computeDraftFromPointer(moveEvent.clientX, moveEvent.clientY);
        if (next) {
          dragState = next;
        }
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        commitDragState();
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    function currentTop(): number {
      if (!dragState) {
        return props.top;
      }
      return (
        ((dragState.draftStartMinute - props.visibleStartMinute) / props.totalVisibleMinutes) *
        100
      );
    }

    function currentHeight(): number {
      if (!dragState) {
        return props.height;
      }
      const span = Math.max(
        dragState.draftEndMinute - dragState.draftStartMinute,
        SLOT_SNAP_MINUTES
      );
      return (span / props.totalVisibleMinutes) * 100;
    }

    function currentTransform(): string | undefined {
      if (!dragState || dragState.mode !== "move") {
        return undefined;
      }
      const dayDelta = dragState.draftDayIndex - dragState.baseDayIndex;
      if (dayDelta === 0) {
        return undefined;
      }
      return `translateX(calc(${dayDelta} * 100%))`;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleActivate(centerPointFromTarget(event.currentTarget));
      }
    }

    return () => (
      <div
        class={`mai-board__event mai-board__event--${props.event.kind}${
          dragState ? " mai-board__event--dragging" : ""
        }`}
        key={`${props.event.kind}-${props.event.id}`}
        style={{
          top: `${currentTop()}%`,
          height: `${currentHeight()}%`,
          transform: currentTransform(),
        }}
        role="button"
        tabindex={0}
        onClick={(event) => {
          if (suppressNextClick) {
            suppressNextClick = false;
            return;
          }
          event.stopPropagation();
          handleActivate({ clientX: event.clientX, clientY: event.clientY });
        }}
        onKeydown={handleKeydown}
        onMousedown={(event) => {
          if (props.event.kind !== "slot") {
            return;
          }
          event.stopPropagation();
          startDrag("move", event);
        }}
      >
        {props.event.kind === "slot" ? (
          <div class="mai-board__event-resize-handles">
            <div
              class="mai-board__event-resize-handle mai-board__event-resize-handle--top"
              onMousedown={(event) => {
                event.stopPropagation();
                startDrag("resize-top", event);
              }}
            ></div>
            <div
              class="mai-board__event-resize-handle mai-board__event-resize-handle--bottom"
              onMousedown={(event) => {
                event.stopPropagation();
                startDrag("resize-bottom", event);
              }}
            ></div>
          </div>
        ) : null}
        <p class="mai-board__event-title">
          {props.event.kind === "slot" ? "Available slot" : "Appointment"}
        </p>
        <p class="mai-board__event-time">
          {props.minuteLabel(props.event.startMinute)}-{props.minuteLabel(props.event.endMinute)}
        </p>
      </div>
    );
  },
});
