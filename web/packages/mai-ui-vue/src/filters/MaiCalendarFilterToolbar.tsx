import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, type PropType } from "vue";
import type { MaiCalendarFilterOwnerOption, MaiViewFilter } from "../types";
import { isMaiViewFilter } from "../validators/events.js";

function normalizeOwnerFilter(ids: readonly string[]): MaiViewFilter {
  const normalizedIds = Array.from(new Set(ids.filter((id) => id.length > 0)));
  if (normalizedIds.length === 0) {
    return { mode: "none" };
  }
  return { mode: "owners", ids: normalizedIds };
}

export const MaiCalendarFilterToolbar = defineComponent({
  name: "MaiCalendarFilterToolbar",
  props: {
    value: {
      type: Object as PropType<MaiViewFilter>,
      required: true,
    },
    ownerOptions: {
      type: Array as PropType<MaiCalendarFilterOwnerOption[]>,
      required: true,
      default: () => [],
    },
    label: {
      type: String,
      required: false,
      default: "Calendars",
    },
  },
  emits: {
    change: (payload: MaiViewFilter) => isMaiViewFilter(payload),
  },
  setup(props, { emit }) {
    const isOpen = ref(false);
    const rootEl = ref<HTMLElement | null>(null);

    const selectedOwnerIds = computed(() =>
      props.value.mode === "owners" || props.value.mode === "group" ? props.value.ids : []
    );

    const selectedCount = computed(() => selectedOwnerIds.value.length);

    const selectedLabel = computed(() => {
      if (props.value.mode === "all") {
        return "All calendars";
      }
      if (props.value.mode === "none") {
        return "No calendars";
      }
      if (selectedCount.value === 1) {
        const option = props.ownerOptions.find(
          (ownerOption) => ownerOption.id === selectedOwnerIds.value[0]
        );
        return option?.label ?? "1 calendar";
      }
      return `${selectedCount.value} calendars`;
    });

    function emitFilter(nextFilter: MaiViewFilter) {
      emit("change", nextFilter);
    }

    function setAll() {
      emitFilter({ mode: "all" });
    }

    function setNone() {
      emitFilter({ mode: "none" });
    }

    function isOwnerSelected(ownerId: string): boolean {
      return selectedOwnerIds.value.includes(ownerId);
    }

    function toggleOwner(ownerId: string) {
      const nextIds = isOwnerSelected(ownerId)
        ? selectedOwnerIds.value.filter((id) => id !== ownerId)
        : [...selectedOwnerIds.value, ownerId];
      emitFilter(normalizeOwnerFilter(nextIds));
    }

    function closeDropdown() {
      isOpen.value = false;
    }

    function toggleDropdown() {
      isOpen.value = !isOpen.value;
    }

    function onDocumentPointerDown(event: Event) {
      const root = rootEl.value;
      if (!root) {
        return;
      }
      const target = event.target as Node | null;
      if (!target || root.contains(target)) {
        return;
      }
      closeDropdown();
    }

    onMounted(() => {
      document.addEventListener("pointerdown", onDocumentPointerDown);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("pointerdown", onDocumentPointerDown);
    });

    return () => (
      <section class="mai-filter-toolbar" ref={rootEl}>
        <span class="mai-filter-toolbar__label">{props.label}</span>
        <div class="mai-filter-toolbar__controls">
          <button
            type="button"
            class={[
              "mai-filter-toolbar__mode-button",
              props.value.mode === "all" ? "mai-filter-toolbar__mode-button--active" : "",
            ]}
            aria-pressed={props.value.mode === "all"}
            onClick={setAll}
          >
            All
          </button>
          <button
            type="button"
            class={[
              "mai-filter-toolbar__mode-button",
              props.value.mode === "none" ? "mai-filter-toolbar__mode-button--active" : "",
            ]}
            aria-pressed={props.value.mode === "none"}
            onClick={setNone}
          >
            None
          </button>
          <div class="mai-filter-toolbar__dropdown">
            <button
              type="button"
              class="mai-filter-toolbar__dropdown-trigger"
              aria-haspopup="menu"
              aria-expanded={isOpen.value}
              onClick={toggleDropdown}
            >
              <span>{selectedLabel.value}</span>
              <span aria-hidden="true" class="mai-filter-toolbar__chevron">
                {isOpen.value ? "^" : "v"}
              </span>
            </button>

            {isOpen.value ? (
              <div class="mai-filter-toolbar__dropdown-panel" role="menu">
                <ul class="mai-filter-toolbar__owner-list">
                  {props.ownerOptions.map((ownerOption) => (
                    <li key={ownerOption.id} class="mai-filter-toolbar__owner-item">
                      <label class="mai-filter-toolbar__owner-label">
                        <input
                          type="checkbox"
                          checked={isOwnerSelected(ownerOption.id)}
                          onChange={() => toggleOwner(ownerOption.id)}
                        />
                        <span class="mai-filter-toolbar__owner-text">
                          {ownerOption.label}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  },
});
