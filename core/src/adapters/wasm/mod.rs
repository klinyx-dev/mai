use serde::{Deserialize, Serialize};

use crate::{
    AddAppointmentCommand, AddSlotCommand, CancelSlotCommand, DeleteAppointmentCommand,
    DeleteSlotCommand, SchedulerError, SchedulerService, WeeklyLayout, WeeklyLayoutQuery,
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

#[derive(Clone, Debug, Default)]
pub struct WasmSchedulerAdapter {
    service: SchedulerService,
}

impl WasmSchedulerAdapter {
    pub fn new() -> Self {
        Self {
            service: SchedulerService::new(),
        }
    }

    pub fn execute_command(&mut self, request: WasmCommandRequest) -> WasmCommandResponse {
        let result = match request {
            WasmCommandRequest::AddSlot(cmd) => self.service.add_slot(cmd),
            WasmCommandRequest::DeleteSlot(cmd) => self.service.delete_slot(cmd),
            WasmCommandRequest::CancelSlot(cmd) => self.service.cancel_slot(cmd),
            WasmCommandRequest::AddAppointment(cmd) => self.service.add_appointment(cmd),
            WasmCommandRequest::DeleteAppointment(cmd) => self.service.delete_appointment(cmd),
        };

        match result {
            Ok(()) => WasmCommandResponse::Success {
                data: WasmMutationSuccess::Applied,
            },
            Err(error) => WasmCommandResponse::Error { error },
        }
    }

    pub fn execute_query(&self, request: WasmQueryRequest) -> WasmQueryResponse {
        match request {
            WasmQueryRequest::WeeklyLayout(query) => WasmQueryResponse::Success {
                data: self.service.get_weekly_layout(query),
            },
        }
    }

    pub fn execute_command_json(&mut self, input: &str) -> Result<String, serde_json::Error> {
        let request = parse_command_request(input)?;
        let response = self.execute_command(request);
        render_command_response(&response)
    }

    pub fn execute_query_json(&self, input: &str) -> Result<String, serde_json::Error> {
        let request = parse_query_request(input)?;
        let response = self.execute_query(request);
        render_query_response(&response)
    }
}

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
