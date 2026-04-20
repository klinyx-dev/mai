use chrono::{NaiveDate, TimeZone, Utc};
use mai::{
    adapters::wasm::{
        parse_command_request, parse_query_request, render_command_response, render_query_response,
        WasmCommandRequest, WasmCommandResponse, WasmMutationSuccess, WasmQueryRequest,
        WasmQueryResponse,
    },
    AddAppointmentCommand, AddSlotCommand, BusinessRuleError, SchedulerError, WeeklyLayoutQuery,
};

#[test]
fn add_slot_command_serializes_as_adapter_friendly_json() {
    let command = AddSlotCommand {
        slot_id: "slot-1001".into(),
        start: Utc.with_ymd_and_hms(2026, 5, 4, 9, 0, 0).unwrap(),
        end: Utc.with_ymd_and_hms(2026, 5, 4, 9, 30, 0).unwrap(),
        assignee_id: "doctor-42".into(),
        created_by: "admin-7".into(),
    };

    let json = serde_json::to_value(&command).unwrap();

    assert_eq!(json["slot_id"], "slot-1001");
    assert_eq!(json["start"], "2026-05-04T09:00:00Z");
    assert_eq!(json["end"], "2026-05-04T09:30:00Z");
    assert_eq!(json["assignee_id"], "doctor-42");
    assert_eq!(json["created_by"], "admin-7");
}

#[test]
fn add_appointment_command_round_trips() {
    let command = AddAppointmentCommand {
        appointment_id: "appt-9001".into(),
        slot_id: "slot-1001".into(),
        invitee_ids: vec!["patient-77".into()],
        title: "Follow-up Consultation".to_string(),
        created_by: "staff-3".into(),
    };

    let json = serde_json::to_string(&command).unwrap();
    let restored: AddAppointmentCommand = serde_json::from_str(&json).unwrap();

    assert_eq!(restored, command);
}

#[test]
fn weekly_layout_query_round_trips_with_iso_date() {
    let query = WeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
    };

    let json = serde_json::to_value(&query).unwrap();
    assert_eq!(json["anchor_date"], "2026-05-07");

    let restored: WeeklyLayoutQuery = serde_json::from_value(json).unwrap();
    assert_eq!(restored, query);
}

#[test]
fn scheduler_error_serializes_with_stable_tagged_shape() {
    let error = SchedulerError::Business(BusinessRuleError::SlotAlreadyBooked);

    let json = serde_json::to_value(&error).unwrap();

    assert_eq!(json["kind"], "Business");
    assert_eq!(json["detail"], "SlotAlreadyBooked");

    let restored: SchedulerError = serde_json::from_value(json).unwrap();
    assert_eq!(restored, error);
}

#[test]
fn wasm_command_request_uses_tagged_envelope() {
    let request = WasmCommandRequest::AddSlot(AddSlotCommand {
        slot_id: "slot-1001".into(),
        start: Utc.with_ymd_and_hms(2026, 5, 4, 9, 0, 0).unwrap(),
        end: Utc.with_ymd_and_hms(2026, 5, 4, 9, 30, 0).unwrap(),
        assignee_id: "doctor-42".into(),
        created_by: "admin-7".into(),
    });

    let json = serde_json::to_value(&request).unwrap();

    assert_eq!(json["command"], "add_slot");
    assert_eq!(json["payload"]["slot_id"], "slot-1001");
    assert_eq!(json["payload"]["start"], "2026-05-04T09:00:00Z");

    let restored: WasmCommandRequest = serde_json::from_value(json).unwrap();
    assert_eq!(restored, request);
}

#[test]
fn wasm_query_request_uses_tagged_envelope() {
    let request = WasmQueryRequest::WeeklyLayout(WeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
    });

    let json = serde_json::to_value(&request).unwrap();

    assert_eq!(json["query"], "weekly_layout");
    assert_eq!(json["payload"]["anchor_date"], "2026-05-07");

    let restored: WasmQueryRequest = serde_json::from_value(json).unwrap();
    assert_eq!(restored, request);
}

#[test]
fn wasm_command_response_uses_shared_success_envelope() {
    let response = WasmCommandResponse::Success {
        data: WasmMutationSuccess::Applied,
    };

    let json = serde_json::to_value(&response).unwrap();

    assert_eq!(json["status"], "success");
    assert_eq!(json["data"], "applied");

    let restored: WasmCommandResponse = serde_json::from_value(json).unwrap();
    assert_eq!(restored, response);
}

#[test]
fn wasm_error_response_wraps_scheduler_error() {
    let response = WasmCommandResponse::Error {
        error: SchedulerError::Business(BusinessRuleError::SlotAlreadyBooked),
    };

    let json = serde_json::to_value(&response).unwrap();

    assert_eq!(json["status"], "error");
    assert_eq!(json["error"]["kind"], "Business");
    assert_eq!(json["error"]["detail"], "SlotAlreadyBooked");

    let restored: WasmCommandResponse = serde_json::from_value(json).unwrap();
    assert_eq!(restored, response);
}

#[test]
fn wasm_contract_helpers_parse_and_render_json_strings() {
    let command_json = r#"{
        "command":"delete_slot",
        "payload":{"slot_id":"slot-1001"}
    }"#;
    let query_json = r#"{
        "query":"weekly_layout",
        "payload":{"anchor_date":"2026-05-07"}
    }"#;

    let command = parse_command_request(command_json).unwrap();
    let query = parse_query_request(query_json).unwrap();

    assert_eq!(
        command,
        WasmCommandRequest::DeleteSlot(mai::DeleteSlotCommand {
            slot_id: "slot-1001".into(),
        })
    );
    assert_eq!(
        query,
        WasmQueryRequest::WeeklyLayout(WeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
        })
    );

    let rendered_command = render_command_response(&WasmCommandResponse::Success {
        data: WasmMutationSuccess::Applied,
    })
    .unwrap();
    let rendered_query = render_query_response(&WasmQueryResponse::Error {
        error: SchedulerError::Business(BusinessRuleError::SlotAlreadyBooked),
    })
    .unwrap();

    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&rendered_command).unwrap()["status"],
        "success"
    );
    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&rendered_query).unwrap()["error"]["detail"],
        "SlotAlreadyBooked"
    );
}
