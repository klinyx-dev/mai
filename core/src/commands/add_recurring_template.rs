use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::domain::ActorId;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AddRecurringTemplateCommand {
    pub template_id: String,
    pub resource_owner_id: ActorId,
    pub weekday: u8,
    pub start_minute: u16,
    pub end_minute: u16,
    pub effective_from: NaiveDate,
    pub effective_until: NaiveDate,
    pub created_by: ActorId,
}
