import type { WeeklyLayout } from "@mai/mai-web-core";
import type {
  MaiBookingAvailabilitySlot,
  MaiBookingSlotOwner,
} from "../types/booking";

export function sortAvailabilitySlots(
  slots: readonly MaiBookingAvailabilitySlot[]
): MaiBookingAvailabilitySlot[] {
  return [...slots].sort(
    (left, right) =>
      left.dayIndex - right.dayIndex ||
      left.startMinute - right.startMinute ||
      left.endMinute - right.endMinute ||
      left.slotId.localeCompare(right.slotId)
  );
}

export function availabilitySlotsForDay(
  slots: readonly MaiBookingAvailabilitySlot[],
  dayIndex: number
): MaiBookingAvailabilitySlot[] {
  return sortAvailabilitySlots(slots).filter((slot) => slot.dayIndex === dayIndex);
}

export function availabilitySlotsFromWeeklyLayout(
  layout: WeeklyLayout | null,
  slotOwners: Readonly<Record<string, MaiBookingSlotOwner>> = {}
): MaiBookingAvailabilitySlot[] {
  if (!layout) {
    return [];
  }

  return sortAvailabilitySlots(
    layout.slots.map((slot) => {
      const owner = slotOwners[slot.slot_id];
      return {
        slotId: slot.slot_id,
        dayIndex: slot.day_index,
        startMinute: slot.start_minute,
        endMinute: slot.end_minute,
        resourceOwnerId: owner?.resourceOwnerId,
        doctorId: owner?.doctorId,
        doctorDisplayName: owner?.doctorDisplayName,
      };
    })
  );
}
