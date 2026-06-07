import type { WeeklyLayout } from "@mai/mai-web-core";
import {
  MAI_BOOKING_SLOT_STATUSES,
  MAI_BOOKING_SLOT_VISIBILITIES,
} from "../../../types/booking.js";
import type {
  MaiBookingAvailabilitySlot,
  MaiBookingSlotOwner,
  MaiBookingSlotStatus,
  MaiBookingSlotVisibility,
} from "../../../types/booking.js";

export function isBookableSlotStatus(status: MaiBookingSlotStatus | undefined): boolean {
  return !status || status === MAI_BOOKING_SLOT_STATUSES.AVAILABLE;
}

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

export function filterAvailabilitySlotsByVisibility(
  slots: readonly MaiBookingAvailabilitySlot[],
  visibility: MaiBookingSlotVisibility = MAI_BOOKING_SLOT_VISIBILITIES.AVAILABLE_ONLY
): MaiBookingAvailabilitySlot[] {
  if (
    visibility === MAI_BOOKING_SLOT_VISIBILITIES.ALL ||
    visibility === MAI_BOOKING_SLOT_VISIBILITIES.SHOW_DISABLED
  ) {
    return sortAvailabilitySlots(slots);
  }
  return sortAvailabilitySlots(slots).filter((slot) => isBookableSlotStatus(slot.status));
}

export function dedupeAvailabilitySlotsByStartMinute(
  slots: readonly MaiBookingAvailabilitySlot[]
): MaiBookingAvailabilitySlot[] {
  const byStartMinute = new Map<string, MaiBookingAvailabilitySlot>();

  for (const slot of sortAvailabilitySlots(slots)) {
    const key = `${slot.dayIndex}:${slot.startMinute}`;
    const current = byStartMinute.get(key);
    if (!current || (!isBookableSlotStatus(current.status) && isBookableSlotStatus(slot.status))) {
      byStartMinute.set(key, slot);
    }
  }

  return sortAvailabilitySlots([...byStartMinute.values()]);
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
        status: MAI_BOOKING_SLOT_STATUSES.AVAILABLE,
        resourceOwnerId: owner?.resourceOwnerId,
        resourceId: owner?.resourceId,
        resourceLabel: owner?.resourceLabel,
        metadata: owner?.metadata,
      };
    })
  );
}
