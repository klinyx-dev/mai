use crate::application::errors::{BusinessRuleError, ReferentialError};
use crate::domain::enums::SlotStatus;
use crate::domain::ids::SlotId;
use crate::domain::slot::Slot;
use crate::domain::time_range::TimeRange;
use crate::state::schedule_state::ScheduleState;

pub fn ensure_slot_exists<'a>(
    state: &'a ScheduleState,
    slot_id: &SlotId,
) -> Result<&'a Slot, ReferentialError> {
    state
        .slots
        .get(slot_id)
        .ok_or(ReferentialError::SlotNotFound)
}

pub fn ensure_slot_is_available(slot: &Slot) -> Result<(), BusinessRuleError> {
    match slot.status {
        SlotStatus::Available => Ok(()),
        SlotStatus::Booked => Err(BusinessRuleError::SlotAlreadyBooked),
        SlotStatus::Cancelled => Err(BusinessRuleError::SlotCancelled),
    }
}

pub fn ensure_slot_is_deletable(slot: &Slot) -> Result<(), BusinessRuleError> {
    if slot.status == SlotStatus::Booked {
        return Err(BusinessRuleError::CannotDeleteBookedSlot);
    }

    Ok(())
}

pub fn ensure_slot_is_cancellable(slot: &Slot) -> Result<(), BusinessRuleError> {
    if slot.status != SlotStatus::Available {
        return Err(BusinessRuleError::SlotNotAvailable);
    }

    Ok(())
}

pub fn ensure_no_overlap_for_resource_owner(
    state: &ScheduleState,
    candidate: &Slot,
) -> Result<(), BusinessRuleError> {
    let overlap = state.slots.values().any(|existing| {
        existing.id != candidate.id
            && existing.resource_owner_id == candidate.resource_owner_id
            && is_active(existing.status)
            && is_active(candidate.status)
            && overlaps(&existing.time, &candidate.time)
    });

    if overlap {
        return Err(BusinessRuleError::SlotOverlap);
    }

    Ok(())
}

fn is_active(status: SlotStatus) -> bool {
    matches!(status, SlotStatus::Available | SlotStatus::Booked)
}

fn overlaps(left: &TimeRange, right: &TimeRange) -> bool {
    left.start < right.end && right.start < left.end
}

#[cfg(test)]
mod tests {
    use super::{ensure_no_overlap_for_resource_owner, overlaps};
    use crate::domain::enums::SlotStatus;
    use crate::domain::ids::{ActorId, SlotId};
    use crate::domain::slot::Slot;
    use crate::domain::time_range::TimeRange;
    use crate::state::schedule_state::ScheduleState;
    use chrono::{TimeZone, Utc};

    #[test]
    fn overlap_detection_handles_intersection_and_touching_edges() {
        let a = TimeRange::new(
            Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
        )
        .unwrap();

        let b = TimeRange::new(
            Utc.with_ymd_and_hms(2026, 1, 5, 9, 30, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 5, 10, 30, 0).unwrap(),
        )
        .unwrap();

        let c = TimeRange::new(
            Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 5, 11, 0, 0).unwrap(),
        )
        .unwrap();

        assert!(overlaps(&a, &b));
        assert!(!overlaps(&a, &c));
    }

    #[test]
    fn rejects_overlapping_active_slots_for_same_resource_owner() {
        let mut state = ScheduleState::new();
        let resource_owner = ActorId::new("owner-1");

        let existing = Slot::new(
            SlotId::new("slot-1"),
            TimeRange::new(
                Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap(),
                Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            )
            .unwrap(),
            resource_owner.clone(),
            ActorId::new("creator-1"),
        );
        state.slots.insert(existing.id.clone(), existing);

        let candidate = Slot::with_status(
            SlotId::new("slot-2"),
            TimeRange::new(
                Utc.with_ymd_and_hms(2026, 1, 5, 9, 30, 0).unwrap(),
                Utc.with_ymd_and_hms(2026, 1, 5, 10, 30, 0).unwrap(),
            )
            .unwrap(),
            resource_owner,
            ActorId::new("creator-2"),
            SlotStatus::Available,
        );

        let result = ensure_no_overlap_for_resource_owner(&state, &candidate);
        assert!(result.is_err());
    }

    #[test]
    fn ignores_cancelled_slots_for_overlap_blocking() {
        let mut state = ScheduleState::new();
        let resource_owner = ActorId::new("owner-1");

        let cancelled = Slot::with_status(
            SlotId::new("slot-1"),
            TimeRange::new(
                Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap(),
                Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            )
            .unwrap(),
            resource_owner.clone(),
            ActorId::new("creator-1"),
            SlotStatus::Cancelled,
        );
        state.slots.insert(cancelled.id.clone(), cancelled);

        let candidate = Slot::new(
            SlotId::new("slot-2"),
            TimeRange::new(
                Utc.with_ymd_and_hms(2026, 1, 5, 9, 30, 0).unwrap(),
                Utc.with_ymd_and_hms(2026, 1, 5, 10, 30, 0).unwrap(),
            )
            .unwrap(),
            resource_owner,
            ActorId::new("creator-2"),
        );

        let result = ensure_no_overlap_for_resource_owner(&state, &candidate);
        assert!(result.is_ok());
    }
}
