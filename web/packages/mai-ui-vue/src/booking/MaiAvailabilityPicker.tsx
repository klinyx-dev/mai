import { defineComponent, h, type PropType } from "vue";
import { DAY_LABELS, formatMinuteLabel } from "../board/model/view-model.js";
import type { TimeLabelFormat, WeekShift } from "../types";
import type { MaiBookingAvailabilitySlot } from "../types/booking";
import { availabilitySlotsForDay } from "./availability.js";

export const MaiAvailabilityPicker = defineComponent({
  name: "MaiAvailabilityPicker",
  props: {
    slots: {
      type: Array as PropType<MaiBookingAvailabilitySlot[]>,
      required: true,
    },
    selectedSlotId: {
      type: String,
      default: null,
    },
    weekLabel: {
      type: String,
      required: true,
    },
    timeLabelFormat: {
      type: String as PropType<TimeLabelFormat>,
      default: "24h",
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    emptyStateText: {
      type: String,
      default: "No available slots this week",
    },
  },
  emits: {
    navigateWeek: (shift: WeekShift) => shift === -1 || shift === 0 || shift === 1,
    slotSelected: (slot: MaiBookingAvailabilitySlot) => slot.slotId.length > 0,
  },
  setup(props, { emit }) {
    return () => (
      <section class="mai-booking-section" aria-labelledby="mai-booking-availability-title">
        <div class="mai-booking-toolbar">
          <div class="mai-booking-section__header">
            <p class="mai-booking-section__eyebrow">Availability</p>
            <h3 class="mai-booking-section__title" id="mai-booking-availability-title">
              Choose a slot
            </h3>
          </div>
          <div class="mai-booking-week-nav" aria-label="Week navigation">
            <button
              type="button"
              class="mai-booking-nav-button"
              onClick={() => emit("navigateWeek", -1)}
            >
              Previous
            </button>
            <p class="mai-booking-week-label">{props.weekLabel}</p>
            <button
              type="button"
              class="mai-booking-nav-button"
              onClick={() => emit("navigateWeek", 1)}
            >
              Next
            </button>
          </div>
        </div>
        {props.isLoading ? (
          <p class="mai-booking-empty">Loading availability...</p>
        ) : props.slots.length === 0 ? (
          <p class="mai-booking-empty">{props.emptyStateText}</p>
        ) : (
          <div class="mai-booking-days">
            {DAY_LABELS.map((label, dayIndex) => {
              const daySlots = availabilitySlotsForDay(props.slots, dayIndex);
              return (
                <section class="mai-booking-day" key={label}>
                  <h4 class="mai-booking-day__label">{label}</h4>
                  <div class="mai-booking-slot-list">
                    {daySlots.length === 0 ? (
                      <p class="mai-booking-day__empty">No slots</p>
                    ) : (
                      daySlots.map((slot) => {
                        const isSelected = props.selectedSlotId === slot.slotId;
                        const timeLabel = `${formatMinuteLabel(
                          slot.startMinute,
                          props.timeLabelFormat
                        )} - ${formatMinuteLabel(
                          slot.endMinute,
                          props.timeLabelFormat
                        )}`;
                        return (
                          <button
                            type="button"
                            class={[
                              "mai-booking-slot",
                              isSelected ? "mai-booking-slot--selected" : "",
                            ]}
                            aria-pressed={isSelected}
                            onClick={() => emit("slotSelected", slot)}
                            key={slot.slotId}
                          >
                            <span class="mai-booking-slot__time">{timeLabel}</span>
                            {slot.doctorDisplayName ? (
                              <span class="mai-booking-slot__doctor">
                                {slot.doctorDisplayName}
                              </span>
                            ) : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    );
  },
});
