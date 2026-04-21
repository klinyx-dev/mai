use chrono::{NaiveDate, TimeZone, Utc};
use mai::{
    AddAppointmentCommand, AddSlotCommand, BusinessRuleError, ReferentialError, SchedulerError,
    WeeklyLayoutQuery,
    adapters::wasm::{
        WasmAdapterError, WasmBindgenAdapter, WasmCommandRequest, WasmCommandResponse,
        WasmErrorCategory, WasmMutationSuccess, WasmQueryRequest, WasmQueryResponse,
        WasmSchedulerAdapter, WasmWeeklyLayoutQuery, parse_command_request, parse_query_request,
        render_command_response, render_query_response,
    },
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
    let request = WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
        timezone: None,
    });

    let json = serde_json::to_value(&request).unwrap();

    assert_eq!(json["query"], "weekly_layout");
    assert_eq!(json["payload"]["anchor_date"], "2026-05-07");

    let restored: WasmQueryRequest = serde_json::from_value(json).unwrap();
    assert_eq!(restored, request);
}

#[test]
fn wasm_query_request_accepts_optional_timezone() {
    let request = WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
        timezone: Some("Europe/Paris".to_string()),
    });

    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json["query"], "weekly_layout");
    assert_eq!(json["payload"]["anchor_date"], "2026-05-07");
    assert_eq!(json["payload"]["timezone"], "Europe/Paris");

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
        error: WasmAdapterError::from_scheduler_error(SchedulerError::Business(
            BusinessRuleError::SlotAlreadyBooked,
        )),
    };

    let json = serde_json::to_value(&response).unwrap();

    assert_eq!(json["status"], "error");
    assert_eq!(json["error"]["category"], "business");
    assert_eq!(json["error"]["code"], "slot_already_booked");
    assert_eq!(json["error"]["message"], "slot is already booked");

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
        WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
            timezone: None,
        })
    );

    let rendered_command = render_command_response(&WasmCommandResponse::Success {
        data: WasmMutationSuccess::Applied,
    })
    .unwrap();
    let rendered_query = render_query_response(&WasmQueryResponse::Error {
        error: WasmAdapterError::from_scheduler_error(SchedulerError::Business(
            BusinessRuleError::SlotAlreadyBooked,
        )),
    })
    .unwrap();

    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&rendered_command).unwrap()["status"],
        "success"
    );
    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&rendered_query).unwrap()["error"]["code"],
        "slot_already_booked"
    );
}

#[test]
fn wasm_adapter_wrapper_applies_mutations_via_json_entrypoint() {
    let mut adapter = WasmSchedulerAdapter::new();
    let add_slot_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T09:30:00Z",
            "assignee_id":"doctor-42",
            "created_by":"admin-7"
        }
    }"#;

    let response = adapter.execute_command_json(add_slot_json);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "success");
    assert_eq!(payload["data"], "applied");
}

#[test]
fn wasm_adapter_wrapper_maps_business_error_for_duplicate_booking() {
    let mut adapter = WasmSchedulerAdapter::new();
    let add_slot_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T09:30:00Z",
            "assignee_id":"doctor-42",
            "created_by":"admin-7"
        }
    }"#;
    let add_appointment_json = r#"{
        "command":"add_appointment",
        "payload":{
            "appointment_id":"appt-9001",
            "slot_id":"slot-1001",
            "invitee_ids":["patient-77"],
            "title":"Follow-up Consultation",
            "created_by":"staff-3"
        }
    }"#;
    let duplicate_appointment_json = r#"{
        "command":"add_appointment",
        "payload":{
            "appointment_id":"appt-9002",
            "slot_id":"slot-1001",
            "invitee_ids":["patient-88"],
            "title":"Second Booking Attempt",
            "created_by":"staff-3"
        }
    }"#;

    adapter.execute_command_json(add_slot_json);
    adapter.execute_command_json(add_appointment_json);

    let response = adapter.execute_command_json(duplicate_appointment_json);

    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "error");
    assert_eq!(payload["error"]["category"], "business");
    assert_eq!(payload["error"]["code"], "slot_already_booked");
}

#[test]
fn wasm_adapter_wrapper_returns_weekly_layout_via_query_json_entrypoint() {
    let mut adapter = WasmSchedulerAdapter::new();
    let add_slot_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T09:30:00Z",
            "assignee_id":"doctor-42",
            "created_by":"admin-7"
        }
    }"#;
    let add_appointment_json = r#"{
        "command":"add_appointment",
        "payload":{
            "appointment_id":"appt-9001",
            "slot_id":"slot-1001",
            "invitee_ids":["patient-77"],
            "title":"Follow-up Consultation",
            "created_by":"staff-3"
        }
    }"#;
    let query_json = r#"{
        "query":"weekly_layout",
        "payload":{
            "anchor_date":"2026-05-07"
        }
    }"#;

    adapter.execute_command_json(add_slot_json);
    adapter.execute_command_json(add_appointment_json);

    let response = adapter.execute_query_json(query_json);

    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "success");
    assert_eq!(payload["data"]["week_start"], "2026-05-04");
    assert_eq!(
        payload["data"]["appointments"][0]["appointment_id"],
        "appt-9001"
    );
}

#[test]
fn wasm_adapter_wrapper_maps_invalid_json_to_contract_error() {
    let mut adapter = WasmSchedulerAdapter::new();
    let malformed = r#"{"command":"add_slot","payload":{"slot_id":"slot-1""#;

    let response = adapter.execute_command_json(malformed);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "error");
    assert_eq!(payload["error"]["category"], "contract");
    assert_eq!(payload["error"]["code"], "invalid_json");
}

#[test]
fn wasm_adapter_error_conversion_is_deterministic_for_business_errors() {
    let error = WasmAdapterError::from_scheduler_error(SchedulerError::Business(
        BusinessRuleError::CannotDeleteBookedSlot,
    ));
    assert_eq!(error.category, WasmErrorCategory::Business);
    assert_eq!(error.code, "cannot_delete_booked_slot");
    assert_eq!(error.message, "cannot delete a booked slot");
}

#[test]
fn wasm_adapter_error_conversion_is_deterministic_for_referential_errors() {
    let error = WasmAdapterError::from_scheduler_error(SchedulerError::Referential(
        ReferentialError::CreatorNotFound,
    ));
    assert_eq!(error.category, WasmErrorCategory::Referential);
    assert_eq!(error.code, "creator_not_found");
    assert_eq!(error.message, "creator not found");
}

#[test]
fn wasm_bindgen_wrapper_delegates_json_entrypoints() {
    let mut adapter = WasmBindgenAdapter::new();
    let add_slot_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T09:30:00Z",
            "assignee_id":"doctor-42",
            "created_by":"admin-7"
        }
    }"#;
    let query_json = r#"{
        "query":"weekly_layout",
        "payload":{
            "anchor_date":"2026-05-07"
        }
    }"#;

    let command_response = adapter.execute_command_json(add_slot_json);
    let query_response = adapter.execute_query_json(query_json);

    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&command_response).unwrap()["status"],
        "success"
    );
    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&query_response).unwrap()["status"],
        "success"
    );
}

#[test]
fn wasm_bindgen_wrapper_public_signature_stays_json_only() {
    let _constructor: fn() -> WasmBindgenAdapter = WasmBindgenAdapter::new;
    let _command_api: fn(&mut WasmBindgenAdapter, &str) -> String =
        WasmBindgenAdapter::execute_command_json;
    let _query_api: fn(&WasmBindgenAdapter, &str) -> String =
        WasmBindgenAdapter::execute_query_json;
}
