import { defineComponent, h, type PropType } from "vue";
import type { DragMode } from "./types";

export const MaiEventResizeHandles = defineComponent({
  name: "MaiEventResizeHandles",
  props: {
    onStartDrag: { type: Function as PropType<(mode: DragMode, event: MouseEvent) => void>, required: true },
  },
  setup(props) {
    return () => (
      <div class="mai-board__event-resize-handles">
        <div
          class="mai-board__event-resize-handle mai-board__event-resize-handle--top"
          onMousedown={(event) => props.onStartDrag("resize-top", event)}
        ></div>
        <div
          class="mai-board__event-resize-handle mai-board__event-resize-handle--bottom"
          onMousedown={(event) => props.onStartDrag("resize-bottom", event)}
        ></div>
      </div>
    );
  },
});
