use serde::{Deserialize, Serialize};

use crate::application::errors::{BusinessRuleError, StructuralError};
use crate::domain::enums::SlotStatus;
use crate::domain::ids::{ActorId, SlotId};
use crate::domain::time_range::TimeRange;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Slot {
    pub id: SlotId,
    pub time: TimeRange,
    pub resource_owner_id: ActorId,
    pub created_by: ActorId,
    pub status: SlotStatus,
}

impl Slot {
    pub fn new(
        id: SlotId,
        time: TimeRange,
        resource_owner_id: ActorId,
        created_by: ActorId,
    ) -> Self {
        Self {
            id,
            time,
            resource_owner_id,
            created_by,
            status: SlotStatus::Available,
        }
    }

    pub fn with_status(
        id: SlotId,
        time: TimeRange,
        resource_owner_id: ActorId,
        created_by: ActorId,
        status: SlotStatus,
    ) -> Self {
        Self {
            id,
            time,
            resource_owner_id,
            created_by,
            status,
        }
    }

    pub fn book(&mut self) -> Result<(), BusinessRuleError> {
        match self.status {
            SlotStatus::Available => {
                self.status = SlotStatus::Booked;
                Ok(())
            }
            SlotStatus::Booked => Err(BusinessRuleError::SlotAlreadyBooked),
            SlotStatus::Cancelled => Err(BusinessRuleError::SlotCancelled),
        }
    }

    pub fn cancel(&mut self) -> Result<(), BusinessRuleError> {
        if self.status != SlotStatus::Available {
            return Err(BusinessRuleError::SlotNotAvailable);
        }
        self.status = SlotStatus::Cancelled;
        Ok(())
    }

    pub fn make_available(&mut self) {
        self.status = SlotStatus::Available;
    }

    pub fn reschedule(&mut self, new_time: TimeRange) -> Result<(), BusinessRuleError> {
        if self.status != SlotStatus::Available {
            return Err(BusinessRuleError::SlotNotAvailable);
        }
        self.time = new_time;
        Ok(())
    }

    pub fn rebuilt_time_range(
        start: chrono::DateTime<chrono::Utc>,
        end: chrono::DateTime<chrono::Utc>,
    ) -> Result<TimeRange, StructuralError> {
        TimeRange::new(start, end).map_err(|_| StructuralError::InvalidTimeRange)
    }
}

#[cfg(test)]
mod tests {
    use super::Slot;
    use crate::domain::enums::SlotStatus;
    use crate::domain::ids::{ActorId, SlotId};
    use crate::domain::time_range::TimeRange;
    use chrono::{TimeZone, Utc};

    #[test]
    fn slot_new_defaults_to_available_status() {
        let start = Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap();
        let time = TimeRange::new(start, end).unwrap();

        let slot = Slot::new(
            SlotId::new("slot-1"),
            time,
            ActorId::new("actor-1"),
            ActorId::new("actor-2"),
        );

        assert_eq!(slot.status, SlotStatus::Available);
    }

    #[test]
    fn slot_transition_methods_enforce_status_rules() {
        let start = Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap();
        let time = TimeRange::new(start, end).unwrap();

        let mut slot = Slot::new(
            SlotId::new("slot-1"),
            time.clone(),
            ActorId::new("actor-1"),
            ActorId::new("actor-2"),
        );

        assert!(slot.book().is_ok());
        assert_eq!(slot.status, SlotStatus::Booked);
        assert!(slot.cancel().is_err());
        slot.make_available();
        assert_eq!(slot.status, SlotStatus::Available);
        assert!(slot.cancel().is_ok());
        assert_eq!(slot.status, SlotStatus::Cancelled);
        assert!(slot.book().is_err());
        assert!(slot.reschedule(time).is_err());
    }
}
