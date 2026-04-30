use crate::application::errors::{BusinessRuleError, ReferentialError};
use crate::domain::enums::SlotStatus;
use crate::domain::ids::SlotId;
use crate::domain::slot::Slot;
use crate::state::schedule_state::ScheduleState;

pub fn ensure_slot_exists<'a>(
    state: &'a ScheduleState,
    slot_id: &SlotId,
) -> Result<&'a Slot, ReferentialError> {
    state.slot(slot_id).ok_or(ReferentialError::SlotNotFound)
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

#[cfg(test)]
mod tests {
    use super::ensure_slot_is_available;
    use crate::application::errors::BusinessRuleError;
    use crate::domain::enums::SlotStatus;
    use crate::domain::slot::Slot;
    use crate::domain::time_range::TimeRange;
    use chrono::{TimeZone, Utc};

    #[test]
    fn ensure_slot_available_maps_status_to_business_errors() {
        let available = Slot::new(
            crate::domain::ids::SlotId::new("slot-available"),
            TimeRange::new(
                Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap(),
                Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            )
            .unwrap(),
            crate::domain::ids::ActorId::new("owner"),
            crate::domain::ids::ActorId::new("creator"),
        );
        assert!(ensure_slot_is_available(&available).is_ok());

        let booked = Slot::with_status(
            available.id.clone(),
            available.time,
            available.resource_owner_id.clone(),
            available.created_by.clone(),
            SlotStatus::Booked,
        );
        assert_eq!(
            ensure_slot_is_available(&booked),
            Err(BusinessRuleError::SlotAlreadyBooked)
        );

        let cancelled = Slot::with_status(
            crate::domain::ids::SlotId::new("slot-cancelled"),
            TimeRange::new(
                Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
                Utc.with_ymd_and_hms(2026, 1, 5, 11, 0, 0).unwrap(),
            )
            .unwrap(),
            crate::domain::ids::ActorId::new("owner"),
            crate::domain::ids::ActorId::new("creator"),
            SlotStatus::Cancelled,
        );
        assert_eq!(
            ensure_slot_is_available(&cancelled),
            Err(BusinessRuleError::SlotCancelled)
        );
    }
}
