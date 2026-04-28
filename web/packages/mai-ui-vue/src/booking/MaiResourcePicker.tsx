import { computed, defineComponent, h, type PropType } from "vue";
import type { MaiBookingCopy, MaiBookingResource } from "../types/booking";
import { eligibleResourcesForCategory } from "./options.js";

export const MaiResourcePicker = defineComponent({
  name: "MaiResourcePicker",
  props: {
    resources: {
      type: Array as PropType<MaiBookingResource[]>,
      required: true,
    },
    selectedCategoryId: {
      type: String,
      default: null,
    },
    selectedResourceId: {
      type: String,
      default: null,
    },
    copy: {
      type: Object as PropType<MaiBookingCopy>,
      default: () => ({}),
    },
  },
  emits: {
    resourceSelected: (resourceId: string | null) =>
      resourceId === null || resourceId.length > 0,
  },
  setup(props, { emit }) {
    const eligibleResources = computed(() =>
      eligibleResourcesForCategory(props.resources, props.selectedCategoryId)
    );

    return () => (
      <section class="mai-booking-section" aria-labelledby="mai-booking-resource-title">
        <div class="mai-booking-section__header">
          <p class="mai-booking-section__eyebrow">
            {props.copy.resourceEyebrow ?? "Resource"}
          </p>
          <h3 class="mai-booking-section__title" id="mai-booking-resource-title">
            {props.copy.resourceTitle ?? "Choose a resource"}
          </h3>
          <p class="mai-booking-section__description">
            {props.copy.resourceDescription ??
              "Optional. Leave unset to see all eligible resources."}
          </p>
        </div>
        <div class="mai-booking-option-grid mai-booking-option-grid--compact">
          <button
            type="button"
            class={[
              "mai-booking-option",
              "mai-booking-option--compact",
              props.selectedResourceId === null ? "mai-booking-option--selected" : "",
            ]}
            aria-pressed={props.selectedResourceId === null}
            onClick={() => emit("resourceSelected", null)}
          >
            <span class="mai-booking-option__label">
              {props.copy.anyResourceLabel ?? "Any available resource"}
            </span>
            <span class="mai-booking-option__meta">
              {props.copy.anyResourceMeta ?? "Default"}
            </span>
          </button>
          {eligibleResources.value.map((resource) => {
            const isSelected = resource.resourceId === props.selectedResourceId;
            return (
              <button
                type="button"
                class={[
                  "mai-booking-option",
                  "mai-booking-option--compact",
                  isSelected ? "mai-booking-option--selected" : "",
                ]}
                aria-pressed={isSelected}
                onClick={() => emit("resourceSelected", resource.resourceId)}
                key={resource.resourceId}
              >
                <span class="mai-booking-option__identity">
                  <span class="mai-booking-avatar" aria-hidden="true">
                    {resource.label.slice(0, 1).toUpperCase()}
                  </span>
                  <span class="mai-booking-option__label">{resource.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  },
});
