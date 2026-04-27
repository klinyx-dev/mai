use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::domain::ids::{ActorId, SlotId};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AddSlotCommand {
    pub slot_id: SlotId,
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
    pub resource_owner_id: ActorId,
    pub created_by: ActorId,
}
