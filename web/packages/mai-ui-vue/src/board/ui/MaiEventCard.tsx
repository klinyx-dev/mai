import { defineComponent, h, ref, type PropType } from "vue";
import type { SlotRescheduleActionEventPayload } from "../../types";
import {
  computeMoveDraft,
  computeResizeBottomDraft,
  computeResizeTopDraft,
  SLOT_SNAP_MINUTES,
} from "../model/slot-gesture";
import type { CalendarEvent } from "../model/view-model";

type DragMode = "move" | "resize-top" | "resize-bottom";

const DRAG_ACTIVATION_PX = 4;

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

function eventTitle(kind: CalendarEvent["kind"]): string {
  return kind === "slot" ? "Available slot" : "Appointment";
}

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

function swallowNextClickFromDrag() {
  const onClickCapture = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    window.removeEventListener("click", onClickCapture, true);
  };
  window.addEventListener("click", onClickCapture, true);
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
    const dragState = ref<DragState | null>(null);
    const dragMoved = ref(false);
    const suppressNextClick = ref(false);

    function handleActivate(point: { clientX: number; clientY: number }) {
      props.onActivate(props.event, point);
    }

    function timeText(startMinute: number, endMinute: number): string {
      return `${props.minuteLabel(startMinute)}-${props.minuteLabel(endMinute)}`;
    }

    function draftFromPointer(clientX: number, clientY: number): DragState | null {
      const state = dragState.value;
      if (!state) {
        return null;
      }

      const gesture = {
        deltaClientX: clientX - state.startClientX,
        deltaClientY: clientY - state.startClientY,
        gridHeight: state.gridHeight,
        columnWidth: state.columnWidth,
        totalVisibleMinutes: props.totalVisibleMinutes,
      };

      if (state.mode === "move") {
        const next = computeMoveDraft({
          baseDayIndex: state.baseDayIndex,
          baseStartMinute: state.baseStartMinute,
          baseEndMinute: state.baseEndMinute,
          gesture,
        });
        return {
          ...state,
          draftDayIndex: next.dayIndex,
          draftStartMinute: next.startMinute,
          draftEndMinute: next.endMinute,
        };
      }

      if (state.mode === "resize-top") {
        const next = computeResizeTopDraft({
          baseStartMinute: state.baseStartMinute,
          baseEndMinute: state.baseEndMinute,
          gesture,
        });
        return {
          ...state,
          draftStartMinute: next.startMinute,
          draftEndMinute: next.endMinute,
        };
      }

      const next = computeResizeBottomDraft({
        baseStartMinute: state.baseStartMinute,
        baseEndMinute: state.baseEndMinute,
        gesture,
      });
      return {
        ...state,
        draftStartMinute: next.startMinute,
        draftEndMinute: next.endMinute,
      };
    }

    function commitDrag() {
      const state = dragState.value;
      if (!state || !props.onSlotReschedule || props.event.kind !== "slot") {
        dragState.value = null;
        return;
      }

      const unchanged =
        state.baseDayIndex === state.draftDayIndex &&
        state.baseStartMinute === state.draftStartMinute &&
        state.baseEndMinute === state.draftEndMinute;

      if (!unchanged) {
        props.onSlotReschedule({
          slotId: props.event.slotId,
          dayIndex: state.draftDayIndex,
          startMinute: state.draftStartMinute,
          endMinute: state.draftEndMinute,
        });
      }

      dragState.value = null;
    }

    function bindDragLifecycle() {
      const onMove = (moveEvent: MouseEvent) => {
        const state = dragState.value;
        if (!state) {
          return;
        }
        const movedX = moveEvent.clientX - state.startClientX;
        const movedY = moveEvent.clientY - state.startClientY;
        if (Math.hypot(movedX, movedY) < DRAG_ACTIVATION_PX) {
          return;
        }

        dragMoved.value = true;
        const next = draftFromPointer(moveEvent.clientX, moveEvent.clientY);
        if (next) {
          dragState.value = next;
        }
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);

        if (dragMoved.value) {
          swallowNextClickFromDrag();
          commitDrag();
        } else {
          dragState.value = null;
        }

        suppressNextClick.value = dragMoved.value;
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    function startDrag(mode: DragMode, event: MouseEvent) {
      if (event.button !== 0 || props.event.kind !== "slot") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      const source = event.target instanceof HTMLElement ? event.target : null;
      const card = source?.closest(".mai-board__event") as HTMLElement | null;
      const dayGrid = card?.parentElement;
      if (!card || !dayGrid) {
        return;
      }

      const gridRect = dayGrid.getBoundingClientRect();
      dragState.value = {
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
      dragMoved.value = false;

      bindDragLifecycle();
    }

    function draftTopPercent(state: DragState): number {
      return (
        ((state.draftStartMinute - props.visibleStartMinute) / props.totalVisibleMinutes) * 100
      );
    }

    function draftHeightPercent(state: DragState): number {
      const span = Math.max(
        state.draftEndMinute - state.draftStartMinute,
        SLOT_SNAP_MINUTES
      );
      return (span / props.totalVisibleMinutes) * 100;
    }

    function draftTransform(state: DragState): string | undefined {
      if (state.mode !== "move") {
        return undefined;
      }
      const dayDelta = state.draftDayIndex - state.baseDayIndex;
      return dayDelta === 0 ? undefined : `translateX(calc(${dayDelta} * 100%))`;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleActivate(centerPointFromTarget(event.currentTarget));
      }
    }

    function renderBody(startMinute: number, endMinute: number) {
      return [
        <p class="mai-board__event-title" key="title">
          {eventTitle(props.event.kind)}
        </p>,
        <p class="mai-board__event-time" key="time">
          {timeText(startMinute, endMinute)}
        </p>,
      ];
    }

    function renderResizeHandles() {
      if (props.event.kind !== "slot") {
        return null;
      }
      return (
        <div class="mai-board__event-resize-handles">
          <div
            class="mai-board__event-resize-handle mai-board__event-resize-handle--top"
            onMousedown={(event) => startDrag("resize-top", event)}
          ></div>
          <div
            class="mai-board__event-resize-handle mai-board__event-resize-handle--bottom"
            onMousedown={(event) => startDrag("resize-bottom", event)}
          ></div>
        </div>
      );
    }

    return () => {
      const state = dragState.value;
      const showGhost = Boolean(state && dragMoved.value);
      const isDragging = Boolean(state && dragMoved.value);

      const originClass = [
        "mai-board__event",
        `mai-board__event--${props.event.kind}`,
        showGhost ? "mai-board__event--origin" : "",
        isDragging ? "mai-board__event--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const nodes = [
        <div
          class={originClass}
          key={`${props.event.kind}-${props.event.id}-origin`}
          style={{ top: `${props.top}%`, height: `${props.height}%` }}
          role="button"
          tabindex={0}
          onClick={(event) => {
            event.stopPropagation();
            if (suppressNextClick.value) {
              suppressNextClick.value = false;
              return;
            }
            handleActivate({ clientX: event.clientX, clientY: event.clientY });
          }}
          onKeydown={handleKeydown}
          onMousedown={(event) => startDrag("move", event)}
        >
          {renderResizeHandles()}
          {renderBody(props.event.startMinute, props.event.endMinute)}
        </div>,
      ];

      if (showGhost && state) {
        nodes.push(
          <div
            class={`mai-board__event mai-board__event--ghost mai-board__event--${props.event.kind}`}
            key={`${props.event.kind}-${props.event.id}-ghost`}
            style={{
              top: `${draftTopPercent(state)}%`,
              height: `${draftHeightPercent(state)}%`,
              transform: draftTransform(state),
            }}
          >
            {renderBody(state.draftStartMinute, state.draftEndMinute)}
          </div>
        );
      }

      return nodes;
    };
  },
});
