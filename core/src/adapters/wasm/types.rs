use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::{
    WeeklyLayout,
    commands::{
        AddAppointmentCommand, AddSlotCommand, CancelAppointmentCommand, CancelSlotCommand,
        DeleteAppointmentCommand, DeleteSlotCommand, RescheduleSlotCommand,
    },
    domain::{ActorId, AppointmentId, SlotId},
};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WasmViewFilterMode {
    All,
    None,
    Owners,
    Group,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmAddSlotPayload {
    pub slot_id: SlotId,
    pub start: chrono::DateTime<chrono::Utc>,
    pub end: chrono::DateTime<chrono::Utc>,
    pub resource_owner_id: ActorId,
    pub created_by: ActorId,
}

impl From<WasmAddSlotPayload> for AddSlotCommand {
    fn from(value: WasmAddSlotPayload) -> Self {
        Self {
            slot_id: value.slot_id,
            start: value.start,
            end: value.end,
            resource_owner_id: value.resource_owner_id,
            created_by: value.created_by,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmDeleteSlotPayload {
    pub slot_id: SlotId,
}

impl From<WasmDeleteSlotPayload> for DeleteSlotCommand {
    fn from(value: WasmDeleteSlotPayload) -> Self {
        Self {
            slot_id: value.slot_id,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmCancelSlotPayload {
    pub slot_id: SlotId,
}

impl From<WasmCancelSlotPayload> for CancelSlotCommand {
    fn from(value: WasmCancelSlotPayload) -> Self {
        Self {
            slot_id: value.slot_id,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmAddAppointmentPayload {
    pub appointment_id: AppointmentId,
    pub slot_id: SlotId,
    pub invitee_ids: Vec<ActorId>,
    pub title: String,
    pub created_by: ActorId,
}

impl From<WasmAddAppointmentPayload> for AddAppointmentCommand {
    fn from(value: WasmAddAppointmentPayload) -> Self {
        Self {
            appointment_id: value.appointment_id,
            slot_id: value.slot_id,
            invitee_ids: value.invitee_ids,
            title: value.title,
            created_by: value.created_by,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmCancelAppointmentPayload {
    pub appointment_id: AppointmentId,
    pub cancelled_by: ActorId,
}

impl From<WasmCancelAppointmentPayload> for CancelAppointmentCommand {
    fn from(value: WasmCancelAppointmentPayload) -> Self {
        Self {
            appointment_id: value.appointment_id,
            cancelled_by: value.cancelled_by,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmDeleteAppointmentPayload {
    pub appointment_id: AppointmentId,
}

impl From<WasmDeleteAppointmentPayload> for DeleteAppointmentCommand {
    fn from(value: WasmDeleteAppointmentPayload) -> Self {
        Self {
            appointment_id: value.appointment_id,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmRescheduleSlotPayload {
    pub slot_id: SlotId,
    pub new_start: chrono::DateTime<chrono::Utc>,
    pub new_end: chrono::DateTime<chrono::Utc>,
    pub updated_by: ActorId,
}

impl From<WasmRescheduleSlotPayload> for RescheduleSlotCommand {
    fn from(value: WasmRescheduleSlotPayload) -> Self {
        Self {
            slot_id: value.slot_id,
            new_start: value.new_start,
            new_end: value.new_end,
            updated_by: value.updated_by,
        }
    }
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
    AddSlot(WasmAddSlotPayload),
    DeleteSlot(WasmDeleteSlotPayload),
    CancelSlot(WasmCancelSlotPayload),
    AddAppointment(WasmAddAppointmentPayload),
    CancelAppointment(WasmCancelAppointmentPayload),
    DeleteAppointment(WasmDeleteAppointmentPayload),
    RescheduleSlot(WasmRescheduleSlotPayload),
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
