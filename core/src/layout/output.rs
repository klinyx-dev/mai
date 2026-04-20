use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::domain::ids::{AppointmentId, SlotId};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WeeklyLayout {
    pub week_start: NaiveDate,
    pub week_end: NaiveDate,
    pub slots: Vec<SlotLayoutNode>,
    pub appointments: Vec<AppointmentLayoutNode>,
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
