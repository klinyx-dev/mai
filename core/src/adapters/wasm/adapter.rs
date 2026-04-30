use crate::SchedulerService;

use super::serde_boundary::{
    parse_command_request, parse_query_request, render_command_response, render_query_response,
};
use super::timezone::{core_weekly_query, normalize_weekly_anchor_date};
use super::{
    WasmAdapterError, WasmCommandRequest, WasmCommandResponse, WasmMutationSuccess,
    WasmQueryRequest, WasmQueryResponse,
};

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
            WasmCommandRequest::AddSlot(cmd) => self.service.add_slot(cmd.into()),
            WasmCommandRequest::DeleteSlot(cmd) => self.service.delete_slot(cmd.into()),
            WasmCommandRequest::CancelSlot(cmd) => self.service.cancel_slot(cmd.into()),
            WasmCommandRequest::AddAppointment(cmd) => self.service.add_appointment(cmd.into()),
            WasmCommandRequest::CancelAppointment(cmd) => {
                self.service.cancel_appointment(cmd.into())
            }
            WasmCommandRequest::DeleteAppointment(cmd) => {
                self.service.delete_appointment(cmd.into())
            }
            WasmCommandRequest::RescheduleSlot(cmd) => self.service.reschedule_slot(cmd.into()),
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
                Ok(anchor_date) => match self
                    .service
                    .get_weekly_layout_checked(core_weekly_query(anchor_date, &query))
                {
                    Ok(layout) => WasmQueryResponse::Success { data: layout },
                    Err(error) => WasmQueryResponse::Error {
                        error: WasmAdapterError::from_scheduler_error(error),
                    },
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
