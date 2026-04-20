use serde::{Deserialize, Serialize};

use crate::{
    AddAppointmentCommand, AddSlotCommand, CancelSlotCommand, DeleteAppointmentCommand,
    DeleteSlotCommand, SchedulerError, WeeklyLayout, WeeklyLayoutQuery,
};

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
    DeleteAppointment(DeleteAppointmentCommand),
}

/// Serialized query envelope for the WASM boundary.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "query", content = "payload", rename_all = "snake_case")]
pub enum WasmQueryRequest {
    WeeklyLayout(WeeklyLayoutQuery),
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
    Error { error: SchedulerError },
}

pub type WasmCommandResponse = WasmResponse<WasmMutationSuccess>;
pub type WasmQueryResponse = WasmResponse<WeeklyLayout>;

pub fn parse_command_request(input: &str) -> Result<WasmCommandRequest, serde_json::Error> {
    serde_json::from_str(input)
}

pub fn parse_query_request(input: &str) -> Result<WasmQueryRequest, serde_json::Error> {
    serde_json::from_str(input)
}

pub fn render_command_response(
    response: &WasmCommandResponse,
) -> Result<String, serde_json::Error> {
    serde_json::to_string(response)
}

pub fn render_query_response(response: &WasmQueryResponse) -> Result<String, serde_json::Error> {
    serde_json::to_string(response)
}
