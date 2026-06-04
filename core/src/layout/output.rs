use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::domain::ids::{ActorId, AppointmentId, SlotId};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WeeklyLayout {
    pub week_start: NaiveDate,
    pub week_end: NaiveDate,
    pub slots: Vec<SlotLayoutNode>,
    pub appointments: Vec<AppointmentLayoutNode>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub blackout_windows: Vec<BlackoutLayoutNode>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct SlotLayoutNode {
    pub slot_id: SlotId,
    pub day_index: u8,
    pub start_minute: u16,
    pub end_minute: u16,
    pub clipped_start: bool,
    pub clipped_end: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AppointmentLayoutNode {
    pub appointment_id: AppointmentId,
    pub slot_id: SlotId,
    pub day_index: u8,
    pub start_minute: u16,
    pub end_minute: u16,
    pub clipped_start: bool,
    pub clipped_end: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct BlackoutLayoutNode {
    pub blackout_id: String,
    pub resource_owner_id: ActorId,
    pub day_index: u8,
    pub start_minute: u16,
    pub end_minute: u16,
    pub clipped_start: bool,
    pub clipped_end: bool,
}
