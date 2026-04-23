use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::domain::ids::{ActorId, SlotId};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct RescheduleSlotCommand {
    pub slot_id: SlotId,
    pub new_start: DateTime<Utc>,
    pub new_end: DateTime<Utc>,
    pub updated_by: ActorId,
}
