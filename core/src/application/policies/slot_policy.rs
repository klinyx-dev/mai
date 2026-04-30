use crate::application::errors::BusinessRuleError;
use crate::domain::enums::SlotStatus;
use crate::domain::slot::Slot;
use crate::domain::time_range::TimeRange;
use crate::state::schedule_state::ScheduleState;

// Verify if the candidate slot overlaps with any existing slot for the resource owner
// Returns an error if the candidate slot overlaps with an existing slot
pub fn ensure_no_overlap_for_resource_owner(
    state: &ScheduleState,
    candidate: &Slot,
) -> Result<(), BusinessRuleError> {
    let overlap = state.slots_iter().any(|existing| {
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

// Check if the slot status is active (available or booked)
fn is_active(status: SlotStatus) -> bool {
    matches!(status, SlotStatus::Available | SlotStatus::Booked)
}

// Check if two time ranges overlap
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
    use proptest::prelude::*;

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
        state.insert_slot(existing.id.clone(), existing);

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
        state.insert_slot(cancelled.id.clone(), cancelled);

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

    proptest! {
        #[test]
        fn overlap_is_symmetric_and_excludes_touching_edges(
            a_start in 0i64..10_000,
            a_len in 1i64..180,
            b_start in 0i64..10_000,
            b_len in 1i64..180
        ) {
            let base = Utc.with_ymd_and_hms(2026, 1, 1, 0, 0, 0).unwrap();
            let a = TimeRange::new(
                base + chrono::Duration::minutes(a_start),
                base + chrono::Duration::minutes(a_start + a_len),
            ).unwrap();
            let b = TimeRange::new(
                base + chrono::Duration::minutes(b_start),
                base + chrono::Duration::minutes(b_start + b_len),
            ).unwrap();

            prop_assert_eq!(overlaps(&a, &b), overlaps(&b, &a));

            let touching = TimeRange::new(a.end, a.end + chrono::Duration::minutes(30)).unwrap();
            prop_assert!(!overlaps(&a, &touching));
        }
    }
}
