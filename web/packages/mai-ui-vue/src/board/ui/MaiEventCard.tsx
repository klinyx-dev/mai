import { defineComponent, h, ref, type PropType } from "vue";
import type { InteractionAnchorRect, SlotRescheduleActionEventPayload } from "../../types";
import type { CalendarEvent } from "../model/view-model";
import { MIN_SLOT_SPAN_MINUTES } from "../model/slot-gesture";
import { MaiEventCardBody } from "./event-card/MaiEventCardBody";
import { MaiEventResizeHandles } from "./event-card/MaiEventResizeHandles";
import {
  buildReschedulePayload,
  centerPointFromTarget,
  draftFromPointer,
  draftHeightPercent,
  draftTopPercent,
  draftTransform,
  DRAG_ACTIVATION_PX,
  eventCardDensity,
  swallowNextClickFromDrag,
} from "./event-card/helpers";
import type { DragMode, DragState } from "./event-card/types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
        (
          event: CalendarEvent,
          point: { clientX: number; clientY: number },
          anchorRect: InteractionAnchorRect
        ) => void
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

    function handleActivate(
      point: { clientX: number; clientY: number },
      target: EventTarget | null
    ) {
      const element = target instanceof HTMLElement ? target : null;
      const rect = element?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      props.onActivate(props.event, point, {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }

    function commitDrag() {
      const state = dragState.value;
      if (!state || !props.onSlotReschedule || props.event.kind !== "slot") {
        dragState.value = null;
        return;
      }

      const payload = buildReschedulePayload(props.event, state);
      if (payload) {
        props.onSlotReschedule(payload);
      }

      dragState.value = null;
    }

    function bindDragLifecycle() {
      const onMove = (moveEvent: PointerEvent) => {
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
        dragState.value = draftFromPointer({
          state,
          clientX: moveEvent.clientX,
          clientY: moveEvent.clientY,
          totalVisibleMinutes: props.totalVisibleMinutes,
        });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);

        if (dragMoved.value) {
          swallowNextClickFromDrag();
          commitDrag();
        } else {
          dragState.value = null;
        }

        suppressNextClick.value = dragMoved.value;
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    }

    function startDrag(mode: DragMode, event: PointerEvent) {
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

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleActivate(centerPointFromTarget(event.currentTarget), event.currentTarget);
      }
    }

    function resizeByKeyboard(mode: DragMode, deltaMinutes: number) {
      if (props.event.kind !== "slot" || !props.onSlotReschedule || deltaMinutes === 0) {
        return;
      }

      const baseStart = props.event.startMinute;
      const baseEnd = props.event.endMinute;
      let nextStart = baseStart;
      let nextEnd = baseEnd;

      if (mode === "resize-top") {
        nextStart = clamp(
          baseStart + deltaMinutes,
          0,
          baseEnd - MIN_SLOT_SPAN_MINUTES
        );
      } else if (mode === "resize-bottom") {
        nextEnd = clamp(
          baseEnd + deltaMinutes,
          baseStart + MIN_SLOT_SPAN_MINUTES,
          1440
        );
      } else {
        return;
      }

      if (nextStart === baseStart && nextEnd === baseEnd) {
        return;
      }

      props.onSlotReschedule({
        slotId: props.event.slotId,
        dayIndex: props.event.dayIndex,
        startMinute: nextStart,
        endMinute: nextEnd,
      });
    }

    return () => {
      const state = dragState.value;
      const showGhost = Boolean(state && dragMoved.value);
      const isDragging = Boolean(state && dragMoved.value);
      const density = eventCardDensity(props.event.startMinute, props.event.endMinute);

      const originClass = [
        "mai-board__event",
        `mai-board__event--${props.event.kind}`,
        `mai-board__event--${density}`,
        showGhost ? "mai-board__event--origin" : "",
        isDragging ? "mai-board__event--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const nodes = [];

      nodes.push(
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
            handleActivate(
              { clientX: event.clientX, clientY: event.clientY },
              event.currentTarget
            );
          }}
          onKeydown={handleKeydown}
          onPointerdown={(event) => startDrag("move", event)}
        >
          {props.event.kind === "slot" ? (
            <MaiEventResizeHandles
              onStartDrag={startDrag}
              onResizeByKeyboard={resizeByKeyboard}
            />
          ) : null}
          <MaiEventCardBody
            eventKind={props.event.kind}
            startMinute={props.event.startMinute}
            endMinute={props.event.endMinute}
            minuteLabel={props.minuteLabel}
            density={density}
          />
        </div>
      );

      if (showGhost && state) {
        nodes.push(
          <div
            class={[
              "mai-board__event",
              "mai-board__event--ghost",
              `mai-board__event--${props.event.kind}`,
              `mai-board__event--${eventCardDensity(
                state.draftStartMinute,
                state.draftEndMinute
              )}`,
            ].join(" ")}
            key={`${props.event.kind}-${props.event.id}-ghost`}
            style={{
              top: `${draftTopPercent(
                state,
                props.visibleStartMinute,
                props.totalVisibleMinutes
              )}%`,
              height: `${draftHeightPercent(state, props.totalVisibleMinutes)}%`,
              transform: draftTransform(state),
            }}
          >
            <MaiEventCardBody
              eventKind={props.event.kind}
              startMinute={state.draftStartMinute}
              endMinute={state.draftEndMinute}
              minuteLabel={props.minuteLabel}
              density={eventCardDensity(state.draftStartMinute, state.draftEndMinute)}
            />
          </div>
        );
      }

      return nodes;
    };
  },
});
