use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::{
    AddAppointmentCommand, AddSlotCommand, CancelAppointmentCommand, CancelSlotCommand,
    DeleteAppointmentCommand, DeleteSlotCommand, RescheduleSlotCommand, WeeklyLayout,
};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WasmViewFilterMode {
    All,
    Owners,
    Group,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmViewFilter {
    pub mode: WasmViewFilterMode,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub ids: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmWeeklyLayoutQuery {
    pub anchor_date: NaiveDate,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub view_filter: Option<WasmViewFilter>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub visible_start_minute: Option<u16>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub visible_end_minute: Option<u16>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub timezone: Option<String>,
}

/// Serialized mutation envelope for the WASM boundary.
///
/// JavaScript callers send this as JSON so the adapter can deserialize into
/// stable core DTOs without exposing internal Rust structs directly.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "command", content = "payload", rename_all = "snake_case")]
pub enum WasmCommandRequest {
    AddSlot(AddSlotCommand),
    DeleteSlot(DeleteSlotCommand),
    CancelSlot(CancelSlotCommand),
    AddAppointment(AddAppointmentCommand),
    CancelAppointment(CancelAppointmentCommand),
    DeleteAppointment(DeleteAppointmentCommand),
    RescheduleSlot(RescheduleSlotCommand),
}

/// Serialized query envelope for the WASM boundary.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "query", content = "payload", rename_all = "snake_case")]
pub enum WasmQueryRequest {
    WeeklyLayout(WasmWeeklyLayoutQuery),
}

/// Stable mutation success marker for adapter consumers.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WasmMutationSuccess {
    Applied,
}

/// Shared adapter response envelope.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum WasmResponse<T> {
    Success { data: T },
    Error { error: WasmAdapterError },
}

pub type WasmCommandResponse = WasmResponse<WasmMutationSuccess>;
pub type WasmQueryResponse = WasmResponse<WeeklyLayout>;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WasmErrorCategory {
    Structural,
    Referential,
    Business,
    Contract,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WasmAdapterError {
    pub category: WasmErrorCategory,
    pub code: String,
    pub message: String,
}
