use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::domain::ActorId;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AddBlackoutWindowCommand {
    pub blackout_id: String,
    pub resource_owner_id: ActorId,
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
    pub reason: String,
    pub created_by: ActorId,
}
