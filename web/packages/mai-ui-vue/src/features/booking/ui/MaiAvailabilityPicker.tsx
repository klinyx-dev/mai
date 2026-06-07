import { defineComponent, h, type PropType } from "vue";
import {
  MAI_DAY_LABELS,
  formatMinuteLabel,
} from "../../board/internal/model/view-model.js";
import {
  MAI_TIME_LABEL_FORMATS,
  type TimeLabelFormat,
  type WeekShift,
} from "../../../types/board.js";
import {
  MAI_BOOKING_SLOT_VISIBILITIES,
} from "../../../types/booking.js";
import type {
  MaiBookingAvailabilitySlot,
  MaiBookingCopy,
  MaiBookingSlotVisibility,
} from "../../../types/booking.js";
import {
  availabilitySlotsForDay,
  filterAvailabilitySlotsByVisibility,
  isBookableSlotStatus,
} from "../model/availability.js";
import { isBookingAvailabilitySlot, isWeekShift } from "../../../validators/events.js";

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
      default: MAI_TIME_LABEL_FORMATS.TWENTY_FOUR_HOUR,
    },
    slotVisibility: {
      type: String as PropType<MaiBookingSlotVisibility>,
      default: MAI_BOOKING_SLOT_VISIBILITIES.AVAILABLE_ONLY,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    copy: {
      type: Object as PropType<MaiBookingCopy>,
      default: () => ({}),
    },
  },
  emits: {
    navigateWeek: (shift: WeekShift) => isWeekShift(shift),
    slotSelected: (slot: MaiBookingAvailabilitySlot) => isBookingAvailabilitySlot(slot),
  },
  setup(props, { emit }) {
    return () => {
      const visibleSlots = filterAvailabilitySlotsByVisibility(
        props.slots,
        props.slotVisibility
      );

      return (
        <section
          class="mai-booking-section"
          aria-labelledby="mai-booking-availability-title"
          aria-busy={props.isLoading}
        >
          <div class="mai-booking-toolbar">
            <div class="mai-booking-section__header">
              <p class="mai-booking-section__eyebrow">
                {props.copy.availabilityEyebrow ?? "Availability"}
              </p>
              <h3 class="mai-booking-section__title" id="mai-booking-availability-title">
                {props.copy.availabilityTitle ?? "Choose a time"}
              </h3>
            </div>
            <div
              class="mai-booking-week-nav"
              aria-label={props.copy.availabilityAriaLabel ?? "Week navigation"}
            >
              <button
                type="button"
                class="mai-booking-nav-button"
                onClick={() => emit("navigateWeek", -1)}
              >
                {props.copy.previousWeek ?? "Previous"}
              </button>
              <p class="mai-booking-week-label">{props.weekLabel}</p>
              <button
                type="button"
                class="mai-booking-nav-button"
                onClick={() => emit("navigateWeek", 1)}
              >
                {props.copy.nextWeek ?? "Next"}
              </button>
            </div>
          </div>
          <div
            class="mai-booking-availability-content"
            aria-live="polite"
            aria-atomic="true"
            role={props.isLoading || visibleSlots.length === 0 ? "status" : undefined}
          >
            {props.isLoading ? (
              <p class="mai-booking-empty">
                {props.copy.loadingAvailability ?? "Loading availability…"}
              </p>
            ) : visibleSlots.length === 0 ? (
              <p class="mai-booking-empty">
                {props.copy.emptyAvailability ?? "No available times this week"}
              </p>
            ) : (
              <div class="mai-booking-days">
                {MAI_DAY_LABELS.map((label, dayIndex) => {
                  const daySlots = availabilitySlotsForDay(visibleSlots, dayIndex);
                  return (
                    <section class="mai-booking-day" key={label}>
                      <h4 class="mai-booking-day__label">{label}</h4>
                      <div class="mai-booking-slot-list">
                        {daySlots.length === 0 ? (
                          <p class="mai-booking-day__empty">
                            {props.copy.emptyDay ?? "No times"}
                          </p>
                        ) : (
                          daySlots.map((slot) => {
                            const isSelected = props.selectedSlotId === slot.slotId;
                            const isBookable = isBookableSlotStatus(slot.status);
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
                                  !isBookable ? "mai-booking-slot--disabled" : "",
                                ]}
                                aria-pressed={isSelected}
                                disabled={!isBookable}
                                onClick={() => emit("slotSelected", slot)}
                                key={slot.slotId}
                              >
                                <span class="mai-booking-slot__time">{timeLabel}</span>
                                {slot.resourceLabel ? (
                                  <span class="mai-booking-slot__resource">
                                    {slot.resourceLabel}
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
          </div>
        </section>
      );
    };
  },
});
