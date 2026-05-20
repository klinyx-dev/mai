use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::domain::ActorId;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ApplyRecurringTemplatesCommand {
    pub week_start: NaiveDate,
    pub owner_ids: Vec<ActorId>,
    pub dry_run: bool,
    pub created_by: ActorId,
}
