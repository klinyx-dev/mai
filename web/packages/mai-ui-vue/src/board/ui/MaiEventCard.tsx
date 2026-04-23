import { defineComponent, h, ref, type PropType } from "vue";
import type { CalendarEvent } from "../model/view-model";
import type { SlotRescheduleActionEventPayload } from "../../types";
import {
  computeMoveDraft,
  computeResizeBottomDraft,
  computeResizeTopDraft,
  SLOT_SNAP_MINUTES,
} from "../model/slot-gesture";

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
    const suppressNextClick = ref(false);
    const dragMoved = ref(false);

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
      if (!dragState.value) {
        return null;
      }
      const gesture = {
        deltaClientX: clientX - dragState.value.startClientX,
        deltaClientY: clientY - dragState.value.startClientY,
        gridHeight: dragState.value.gridHeight,
        columnWidth: dragState.value.columnWidth,
        totalVisibleMinutes: props.totalVisibleMinutes,
      };

      if (dragState.value.mode === "move") {
        const moveDraft = computeMoveDraft({
          baseDayIndex: dragState.value.baseDayIndex,
          baseStartMinute: dragState.value.baseStartMinute,
          baseEndMinute: dragState.value.baseEndMinute,
          gesture,
        });
        return {
          ...dragState.value,
          draftDayIndex: moveDraft.dayIndex,
          draftStartMinute: moveDraft.startMinute,
          draftEndMinute: moveDraft.endMinute,
        };
      }

      if (dragState.value.mode === "resize-top") {
        const resizeDraft = computeResizeTopDraft({
          baseStartMinute: dragState.value.baseStartMinute,
          baseEndMinute: dragState.value.baseEndMinute,
          gesture,
        });
        return {
          ...dragState.value,
          draftStartMinute: resizeDraft.startMinute,
          draftEndMinute: resizeDraft.endMinute,
        };
      }

      const resizeDraft = computeResizeBottomDraft({
        baseStartMinute: dragState.value.baseStartMinute,
        baseEndMinute: dragState.value.baseEndMinute,
        gesture,
      });
      return {
        ...dragState.value,
        draftStartMinute: resizeDraft.startMinute,
        draftEndMinute: resizeDraft.endMinute,
      };
    }

    function commitDragState() {
      if (!dragState.value || !props.onSlotReschedule || props.event.kind !== "slot") {
        dragState.value = null;
        return;
      }
      const unchanged =
        dragState.value.baseDayIndex === dragState.value.draftDayIndex &&
        dragState.value.baseStartMinute === dragState.value.draftStartMinute &&
        dragState.value.baseEndMinute === dragState.value.draftEndMinute;
      if (!unchanged) {
        props.onSlotReschedule({
          slotId: props.event.slotId,
          dayIndex: dragState.value.draftDayIndex,
          startMinute: dragState.value.draftStartMinute,
          endMinute: dragState.value.draftEndMinute,
        });
      }
      dragState.value = null;
    }

    function startDrag(mode: DragMode, event: MouseEvent) {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      if (props.event.kind !== "slot") {
        return;
      }
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

      const onMove = (moveEvent: MouseEvent) => {
        if (!dragState.value) {
          return;
        }
        const movedX = moveEvent.clientX - dragState.value.startClientX;
        const movedY = moveEvent.clientY - dragState.value.startClientY;
        const dragDistance = Math.hypot(movedX, movedY);
        if (dragDistance < DRAG_ACTIVATION_PX) {
          return;
        }
        dragMoved.value = true;
        const next = computeDraftFromPointer(moveEvent.clientX, moveEvent.clientY);
        if (next) {
          dragState.value = next;
        }
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        if (dragMoved.value) {
          swallowNextClickFromDrag();
          commitDragState();
        } else {
          dragState.value = null;
        }
        suppressNextClick.value = dragMoved.value;
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    function currentTop(): number {
      if (!dragState.value) {
        return props.top;
      }
      return (
        ((dragState.value.draftStartMinute - props.visibleStartMinute) /
          props.totalVisibleMinutes) *
          100
      );
    }

    function currentHeight(): number {
      if (!dragState.value) {
        return props.height;
      }
      const span = Math.max(
        dragState.value.draftEndMinute - dragState.value.draftStartMinute,
        SLOT_SNAP_MINUTES
      );
      return (span / props.totalVisibleMinutes) * 100;
    }

    function currentTransform(): string | undefined {
      if (!dragState.value || dragState.value.mode !== "move") {
        return undefined;
      }
      const dayDelta = dragState.value.draftDayIndex - dragState.value.baseDayIndex;
      if (dayDelta === 0) {
        return undefined;
      }
      return `translateX(calc(${dayDelta} * 100%))`;
    }

    function ghostLabelMinuteStart(): number {
      if (!dragState.value) {
        return props.event.startMinute;
      }
      return dragState.value.draftStartMinute;
    }

    function ghostLabelMinuteEnd(): number {
      if (!dragState.value) {
        return props.event.endMinute;
      }
      return dragState.value.draftEndMinute;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleActivate(centerPointFromTarget(event.currentTarget));
      }
    }

    return () => {
      const showGhost = Boolean(dragState.value && dragMoved.value);
      const originKey = `${props.event.kind}-${props.event.id}-origin`;
      const ghostKey = `${props.event.kind}-${props.event.id}-ghost`;

      return [
        <div
          class={`mai-board__event mai-board__event--${props.event.kind}${
            showGhost ? " mai-board__event--origin" : ""
          }`}
          key={originKey}
          style={{
            top: `${props.top}%`,
            height: `${props.height}%`,
          }}
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
          onMousedown={(event) => {
            if (props.event.kind !== "slot") {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            startDrag("move", event);
          }}
        >
          {props.event.kind === "slot" ? (
            <div class="mai-board__event-resize-handles">
              <div
                class="mai-board__event-resize-handle mai-board__event-resize-handle--top"
                onMousedown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startDrag("resize-top", event);
                }}
              ></div>
              <div
                class="mai-board__event-resize-handle mai-board__event-resize-handle--bottom"
                onMousedown={(event) => {
                  event.preventDefault();
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
        </div>,
        showGhost ? (
          <div
            class={`mai-board__event mai-board__event--ghost mai-board__event--${props.event.kind}`}
            key={ghostKey}
            style={{
              top: `${currentTop()}%`,
              height: `${currentHeight()}%`,
              transform: currentTransform(),
            }}
          >
            <p class="mai-board__event-title">
              {props.event.kind === "slot" ? "Available slot" : "Appointment"}
            </p>
            <p class="mai-board__event-time">
              {props.minuteLabel(ghostLabelMinuteStart())}-
              {props.minuteLabel(ghostLabelMinuteEnd())}
            </p>
          </div>
        ) : null,
      ];
    };
  },
});
    function swallowNextClickFromDrag() {
      const onClickCapture = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        window.removeEventListener("click", onClickCapture, true);
      };
      window.addEventListener("click", onClickCapture, true);
    }
