import { defineComponent, h, type PropType } from "vue";
import type { DragMode } from "./types";

export const MaiEventResizeHandles = defineComponent({
  name: "MaiEventResizeHandles",
  props: {
    onStartDrag: {
      type: Function as PropType<(mode: DragMode, event: PointerEvent) => void>,
      required: true,
    },
    onResizeByKeyboard: {
      type: Function as PropType<(mode: DragMode, deltaMinutes: number) => void>,
      required: true,
    },
  },
  setup(props) {
    function handleResizeKey(mode: DragMode, event: KeyboardEvent) {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      props.onResizeByKeyboard(mode, event.key === "ArrowUp" ? -15 : 15);
    }

    return () => (
      <div class="mai-board__event-resize-handles">
        <button
          type="button"
          class="mai-board__event-resize-handle mai-board__event-resize-handle--top"
          aria-label="Resize slot start time"
          onPointerdown={(event) => props.onStartDrag("resize-top", event)}
          onKeydown={(event) => handleResizeKey("resize-top", event)}
        ></button>
        <button
          type="button"
          class="mai-board__event-resize-handle mai-board__event-resize-handle--bottom"
          aria-label="Resize slot end time"
          onPointerdown={(event) => props.onStartDrag("resize-bottom", event)}
          onKeydown={(event) => handleResizeKey("resize-bottom", event)}
        ></button>
      </div>
    );
  },
});
