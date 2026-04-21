import { computed, defineComponent, h } from "vue";
import type { WeeklyLayout } from "@mai/mai-web-core";

export const MaiBoard = defineComponent({
  name: "MaiBoard",
  props: {
    layout: {
      type: Object as () => WeeklyLayout | null,
      required: false,
      default: null,
    },
    title: {
      type: String,
      required: false,
      default: "Doctor Schedule",
    },
  },
  setup(props) {
    const slotCount = computed(() => props.layout?.slots.length ?? 0);
    const appointmentCount = computed(() => props.layout?.appointments.length ?? 0);

    return () =>
      h("section", { class: "mai-board mai-board__panel" }, [
        h("header", { class: "mai-board__header" }, [
          h("h2", props.title),
          h("small", `${slotCount.value} slots · ${appointmentCount.value} appointments`),
        ]),
        props.layout
          ? h(
              "pre",
              {
                style: {
                  overflow: "auto",
                  margin: 0,
                },
              },
              JSON.stringify(props.layout, null, 2)
            )
          : h("p", "No layout loaded."),
      ]);
  },
});
