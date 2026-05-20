use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::application::StructuralError;
use crate::domain::ids::{ActorId, SlotId};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct RecurringTemplate {
    pub template_id: String,
    pub resource_owner_id: ActorId,
    pub weekday: u8,
    pub start_minute: u16,
    pub end_minute: u16,
    pub effective_from: NaiveDate,
    pub effective_until: NaiveDate,
    pub created_by: ActorId,
}

impl RecurringTemplate {
    pub fn validate(&self) -> Result<(), StructuralError> {
        if self.weekday > 6
            || self.start_minute >= self.end_minute
            || self.end_minute > 1440
            || self.effective_from > self.effective_until
        {
            return Err(StructuralError::InvalidRecurrenceRule);
        }
        Ok(())
    }

    pub fn generated_slot_id(&self, day: NaiveDate) -> SlotId {
        SlotId::new(format!(
            "{}-{}-{}-{}",
            self.template_id,
            day.format("%Y%m%d"),
            self.start_minute,
            self.end_minute
        ))
    }
}
