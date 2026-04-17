
use serde::{Deserialize, Serialize};

use crate::domain::enums::SlotStatus;
use crate::domain::ids::{ActorId, SlotId};
use crate::domain::time_range::TimeRange;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Slot {
    pub id: SlotId,
    pub time: TimeRange,
    pub assignee_id: ActorId,
    pub created_by: ActorId,
    pub status: SlotStatus,
}

impl Slot {
    pub fn new(id: SlotId, time: TimeRange, assignee_id: ActorId, created_by: ActorId) -> Self {
        Self {
            id,
            time,
            assignee_id,
            created_by,
            status: SlotStatus::Available,
        }
    }

    pub fn with_status(
        id: SlotId,
        time: TimeRange,
        assignee_id: ActorId,
        created_by: ActorId,
        status: SlotStatus,
    ) -> Self {
        Self {
            id,
            time,
            assignee_id,
            created_by,
            status,
        }
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
}
