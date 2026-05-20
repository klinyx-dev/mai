use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::{
    WeeklyLayout,
    commands::{
        AddAppointmentCommand, AddBlackoutWindowCommand, AddRecurringTemplateCommand,
        AddSlotCommand, AddSlotsBatchCommand, ApplyRecurringTemplatesCommand, BatchMode,
        CancelAppointmentCommand, CancelSlotCommand, DeleteAppointmentCommand, DeleteSlotCommand,
        RescheduleSlotCommand,
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
    #[serde(default = "default_capacity", skip_serializing_if = "is_default_capacity")]
    pub capacity: u16,
}

const fn default_capacity() -> u16 {
    1
}

const fn is_default_capacity(value: &u16) -> bool {
    *value == 1
}

impl From<WasmAddSlotPayload> for AddSlotCommand {
    fn from(value: WasmAddSlotPayload) -> Self {
        Self {
            slot_id: value.slot_id,
            start: value.start,
            end: value.end,
            resource_owner_id: value.resource_owner_id,
            created_by: value.created_by,
            capacity: value.capacity,
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

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmAddRecurringTemplatePayload {
    pub template_id: String,
    pub resource_owner_id: ActorId,
    pub weekday: u8,
    pub start_minute: u16,
    pub end_minute: u16,
    pub effective_from: NaiveDate,
    pub effective_until: NaiveDate,
    pub created_by: ActorId,
}

impl From<WasmAddRecurringTemplatePayload> for AddRecurringTemplateCommand {
    fn from(value: WasmAddRecurringTemplatePayload) -> Self {
        Self {
            template_id: value.template_id,
            resource_owner_id: value.resource_owner_id,
            weekday: value.weekday,
            start_minute: value.start_minute,
            end_minute: value.end_minute,
            effective_from: value.effective_from,
            effective_until: value.effective_until,
            created_by: value.created_by,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmApplyRecurringTemplatesPayload {
    pub week_start: NaiveDate,
    #[serde(default)]
    pub owner_ids: Vec<ActorId>,
    #[serde(default)]
    pub dry_run: bool,
    pub created_by: ActorId,
}

impl From<WasmApplyRecurringTemplatesPayload> for ApplyRecurringTemplatesCommand {
    fn from(value: WasmApplyRecurringTemplatesPayload) -> Self {
        Self {
            week_start: value.week_start,
            owner_ids: value.owner_ids,
            dry_run: value.dry_run,
            created_by: value.created_by,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmAddSlotsBatchPayload {
    pub mode: BatchMode,
    pub slots: Vec<WasmAddSlotPayload>,
}

impl From<WasmAddSlotsBatchPayload> for AddSlotsBatchCommand {
    fn from(value: WasmAddSlotsBatchPayload) -> Self {
        Self {
            mode: value.mode,
            slots: value.slots.into_iter().map(Into::into).collect(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WasmAddBlackoutWindowPayload {
    pub blackout_id: String,
    pub resource_owner_id: ActorId,
    pub start: chrono::DateTime<chrono::Utc>,
    pub end: chrono::DateTime<chrono::Utc>,
    pub reason: String,
    pub created_by: ActorId,
}

impl From<WasmAddBlackoutWindowPayload> for AddBlackoutWindowCommand {
    fn from(value: WasmAddBlackoutWindowPayload) -> Self {
        Self {
            blackout_id: value.blackout_id,
            resource_owner_id: value.resource_owner_id,
            start: value.start,
            end: value.end,
            reason: value.reason,
            created_by: value.created_by,
        }
    }
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
    AddRecurringTemplate(WasmAddRecurringTemplatePayload),
    ApplyRecurringTemplates(WasmApplyRecurringTemplatesPayload),
    AddSlotsBatch(WasmAddSlotsBatchPayload),
    AddBlackoutWindow(WasmAddBlackoutWindowPayload),
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
