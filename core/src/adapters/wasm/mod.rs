use serde::{Deserialize, Serialize};
use chrono::{LocalResult, NaiveDate, TimeZone, Utc};

use crate::{
    AddAppointmentCommand, AddSlotCommand, CancelSlotCommand, DeleteAppointmentCommand,
    DeleteSlotCommand, SchedulerService, WeeklyLayout, WeeklyLayoutQuery,
};
use crate::{BusinessRuleError, ReferentialError, SchedulerError, StructuralError};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WasmWeeklyLayoutQuery {
    pub anchor_date: NaiveDate,
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
    DeleteAppointment(DeleteAppointmentCommand),
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

impl WasmAdapterError {
    pub fn from_scheduler_error(error: SchedulerError) -> Self {
        match error {
            SchedulerError::Structural(err) => Self {
                category: WasmErrorCategory::Structural,
                code: structural_error_code(&err).to_string(),
                message: err.to_string(),
            },
            SchedulerError::Referential(err) => Self {
                category: WasmErrorCategory::Referential,
                code: referential_error_code(&err).to_string(),
                message: err.to_string(),
            },
            SchedulerError::Business(err) => Self {
                category: WasmErrorCategory::Business,
                code: business_error_code(&err).to_string(),
                message: err.to_string(),
            },
        }
    }

    pub fn invalid_json(message: String) -> Self {
        Self {
            category: WasmErrorCategory::Contract,
            code: "invalid_json".to_string(),
            message,
        }
    }

    pub fn invalid_timezone() -> Self {
        Self {
            category: WasmErrorCategory::Contract,
            code: "invalid_timezone".to_string(),
            message: "invalid timezone value".to_string(),
        }
    }
}

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
            Err(error) => WasmCommandResponse::Error {
                error: WasmAdapterError::from_scheduler_error(error),
            },
        }
    }

    pub fn execute_query(&self, request: WasmQueryRequest) -> WasmQueryResponse {
        match request {
            WasmQueryRequest::WeeklyLayout(query) => match normalize_weekly_anchor_date(&query) {
                Ok(anchor_date) => WasmQueryResponse::Success {
                    data: self
                        .service
                        .get_weekly_layout(WeeklyLayoutQuery { anchor_date }),
                },
                Err(error) => WasmQueryResponse::Error { error },
            },
        }
    }

    pub fn execute_command_json(&mut self, input: &str) -> String {
        let response = match parse_command_request(input) {
            Ok(request) => self.execute_command(request),
            Err(err) => WasmCommandResponse::Error {
                error: WasmAdapterError::invalid_json(err.to_string()),
            },
        };

        render_command_response(&response).expect("adapter command response must be serializable")
    }

    pub fn execute_query_json(&self, input: &str) -> String {
        let response = match parse_query_request(input) {
            Ok(request) => self.execute_query(request),
            Err(err) => WasmQueryResponse::Error {
                error: WasmAdapterError::invalid_json(err.to_string()),
            },
        };

        render_query_response(&response).expect("adapter query response must be serializable")
    }
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen)]
pub struct WasmBindgenAdapter {
    inner: WasmSchedulerAdapter,
}

impl Default for WasmBindgenAdapter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen)]
impl WasmBindgenAdapter {
    #[cfg_attr(
        target_arch = "wasm32",
        wasm_bindgen::prelude::wasm_bindgen(constructor)
    )]
    pub fn new() -> Self {
        Self {
            inner: WasmSchedulerAdapter::new(),
        }
    }

    pub fn execute_command_json(&mut self, input: &str) -> String {
        self.inner.execute_command_json(input)
    }

    pub fn execute_query_json(&self, input: &str) -> String {
        self.inner.execute_query_json(input)
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

fn structural_error_code(error: &StructuralError) -> &'static str {
    match error {
        StructuralError::InvalidTimeRange => "invalid_time_range",
        StructuralError::EmptyTitle => "empty_title",
    }
}

fn referential_error_code(error: &ReferentialError) -> &'static str {
    match error {
        ReferentialError::SlotNotFound => "slot_not_found",
        ReferentialError::AppointmentNotFound => "appointment_not_found",
        ReferentialError::AssigneeNotFound => "assignee_not_found",
        ReferentialError::CreatorNotFound => "creator_not_found",
    }
}

fn business_error_code(error: &BusinessRuleError) -> &'static str {
    match error {
        BusinessRuleError::SlotOverlap => "slot_overlap",
        BusinessRuleError::SlotAlreadyBooked => "slot_already_booked",
        BusinessRuleError::SlotCancelled => "slot_cancelled",
        BusinessRuleError::SlotNotAvailable => "slot_not_available",
        BusinessRuleError::CannotDeleteBookedSlot => "cannot_delete_booked_slot",
        BusinessRuleError::AppointmentAlreadyExistsForSlot => "appointment_already_exists_for_slot",
    }
}

fn normalize_weekly_anchor_date(query: &WasmWeeklyLayoutQuery) -> Result<NaiveDate, WasmAdapterError> {
    let timezone_name = query
        .timezone
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);

    let Some(timezone_name) = timezone_name else {
        return Ok(query.anchor_date);
    };

    let timezone = timezone_name
        .parse::<chrono_tz::Tz>()
        .map_err(|_| WasmAdapterError::invalid_timezone())?;

    local_anchor_to_utc_date(query.anchor_date, timezone)
        .ok_or_else(WasmAdapterError::invalid_timezone)
}

fn local_anchor_to_utc_date(anchor_date: NaiveDate, timezone: chrono_tz::Tz) -> Option<NaiveDate> {
    for hour in 0..24 {
        let local_time = anchor_date.and_hms_opt(hour, 0, 0)?;
        let utc_date = match timezone.from_local_datetime(&local_time) {
            LocalResult::Single(date_time) => Some(date_time.with_timezone(&Utc).date_naive()),
            LocalResult::Ambiguous(left, right) => {
                Some(left.min(right).with_timezone(&Utc).date_naive())
            }
            LocalResult::None => None,
        };

        if let Some(date) = utc_date {
            return Some(date);
        }
    }

    None
}
