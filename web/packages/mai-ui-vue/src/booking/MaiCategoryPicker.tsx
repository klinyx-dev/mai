import { defineComponent, h, type PropType } from "vue";
import type { MaiBookingCategory, MaiBookingCopy } from "../types/booking";

export const MaiCategoryPicker = defineComponent({
  name: "MaiCategoryPicker",
  props: {
    categories: {
      type: Array as PropType<MaiBookingCategory[]>,
      required: true,
    },
    selectedCategoryId: {
      type: String,
      default: null,
    },
    copy: {
      type: Object as PropType<MaiBookingCopy>,
      default: () => ({}),
    },
  },
  emits: {
    categorySelected: (categoryId: string) => categoryId.length > 0,
  },
  setup(props, { emit }) {
    return () => (
      <section class="mai-booking-section" aria-labelledby="mai-booking-category-title">
        <div class="mai-booking-section__header">
          <p class="mai-booking-section__eyebrow">
            {props.copy.categoryEyebrow ?? "Category"}
          </p>
          <h3 class="mai-booking-section__title" id="mai-booking-category-title">
            {props.copy.categoryTitle ?? "Choose a category"}
          </h3>
        </div>
        <div class="mai-booking-option-grid">
          {props.categories.map((category) => {
            const isSelected = category.categoryId === props.selectedCategoryId;
            return (
              <button
                type="button"
                class={[
                  "mai-booking-option",
                  isSelected ? "mai-booking-option--selected" : "",
                ]}
                aria-pressed={isSelected}
                onClick={() => emit("categorySelected", category.categoryId)}
                key={category.categoryId}
              >
                <span class="mai-booking-option__label">{category.label}</span>
                {category.description ? (
                  <span class="mai-booking-option__meta">{category.description}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
    );
  },
});
