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
    #[serde(default = "default_capacity", skip_serializing_if = "is_default_capacity")]
    pub capacity: u16,
}

const fn default_capacity() -> u16 {
    1
}

const fn is_default_capacity(value: &u16) -> bool {
    *value == 1
}
