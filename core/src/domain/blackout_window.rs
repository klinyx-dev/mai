use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::application::StructuralError;
use crate::domain::ids::ActorId;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct BlackoutWindow {
    pub blackout_id: String,
    pub resource_owner_id: ActorId,
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
    pub reason: String,
    pub created_by: ActorId,
}

impl BlackoutWindow {
    pub fn validate(&self) -> Result<(), StructuralError> {
        if self.start >= self.end {
            return Err(StructuralError::InvalidTimeRange);
        }
        Ok(())
    }

    pub fn overlaps(&self, start: DateTime<Utc>, end: DateTime<Utc>) -> bool {
        start < self.end && self.start < end
    }
}
