use chrono::{NaiveDate, TimeZone, Utc};
use mai::{
    AddAppointmentCommand, AddSlotCommand, BusinessRuleError, CancelAppointmentCommand,
    ReferentialError, SchedulerError, WeeklyLayoutQuery,
    adapters::wasm::{
        WasmAdapterError, WasmAddSlotPayload, WasmBindgenAdapter, WasmCancelAppointmentPayload,
        WasmCommandRequest, WasmCommandResponse, WasmDeleteSlotPayload, WasmErrorCategory,
        WasmMutationSuccess, WasmQueryRequest, WasmQueryResponse, WasmSchedulerAdapter,
        WasmViewFilter, WasmViewFilterMode, WasmWeeklyLayoutQuery, parse_command_request,
        parse_query_request, render_command_response, render_query_response,
    },
};

#[test]
fn add_slot_command_serializes_as_adapter_friendly_json() {
    let command = AddSlotCommand {
        slot_id: "slot-1001".into(),
        start: Utc.with_ymd_and_hms(2026, 5, 4, 9, 0, 0).unwrap(),
        end: Utc.with_ymd_and_hms(2026, 5, 4, 9, 30, 0).unwrap(),
        resource_owner_id: "owner-42".into(),
        created_by: "admin-7".into(),
    };

    let json = serde_json::to_value(&command).unwrap();

    assert_eq!(json["slot_id"], "slot-1001");
    assert_eq!(json["start"], "2026-05-04T09:00:00Z");
    assert_eq!(json["end"], "2026-05-04T09:30:00Z");
    assert_eq!(json["resource_owner_id"], "owner-42");
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
fn cancel_appointment_command_round_trips() {
    let command = CancelAppointmentCommand {
        appointment_id: "appt-9001".into(),
        cancelled_by: "patient-77".into(),
    };

    let json = serde_json::to_string(&command).unwrap();
    let restored: CancelAppointmentCommand = serde_json::from_str(&json).unwrap();

    assert_eq!(restored, command);
}

#[test]
fn weekly_layout_query_round_trips_with_iso_date() {
    let query = WeeklyLayoutQuery::new(NaiveDate::from_ymd_opt(2026, 5, 7).unwrap());

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
    let request = WasmCommandRequest::AddSlot(WasmAddSlotPayload {
        slot_id: "slot-1001".into(),
        start: Utc.with_ymd_and_hms(2026, 5, 4, 9, 0, 0).unwrap(),
        end: Utc.with_ymd_and_hms(2026, 5, 4, 9, 30, 0).unwrap(),
        resource_owner_id: "owner-42".into(),
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
fn wasm_cancel_appointment_request_uses_tagged_envelope() {
    let request = WasmCommandRequest::CancelAppointment(WasmCancelAppointmentPayload {
        appointment_id: "appt-9001".into(),
        cancelled_by: "patient-77".into(),
    });

    let json = serde_json::to_value(&request).unwrap();

    assert_eq!(json["command"], "cancel_appointment");
    assert_eq!(json["payload"]["appointment_id"], "appt-9001");
    assert_eq!(json["payload"]["cancelled_by"], "patient-77");

    let restored: WasmCommandRequest = serde_json::from_value(json).unwrap();
    assert_eq!(restored, request);
}

#[test]
fn wasm_query_request_uses_tagged_envelope() {
    let request = WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
        view_filter: None,
        visible_start_minute: None,
        visible_end_minute: None,
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
        view_filter: None,
        visible_start_minute: None,
        visible_end_minute: None,
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
fn wasm_query_request_accepts_view_filter_optional_fields() {
    let request = WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
        view_filter: Some(WasmViewFilter {
            mode: WasmViewFilterMode::Owners,
            ids: vec!["owner-42".to_string()],
        }),
        visible_start_minute: Some(540),
        visible_end_minute: Some(1020),
        timezone: None,
    });

    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json["payload"]["view_filter"]["mode"], "owners");
    assert_eq!(json["payload"]["view_filter"]["ids"][0], "owner-42");
    assert_eq!(json["payload"]["visible_start_minute"], 540);
    assert_eq!(json["payload"]["visible_end_minute"], 1020);

    let restored: WasmQueryRequest = serde_json::from_value(json).unwrap();
    assert_eq!(restored, request);
}

#[test]
fn wasm_query_request_accepts_none_view_filter_mode() {
    let request = WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
        view_filter: Some(WasmViewFilter {
            mode: WasmViewFilterMode::None,
            ids: vec![],
        }),
        visible_start_minute: None,
        visible_end_minute: None,
        timezone: None,
    });

    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json["payload"]["view_filter"]["mode"], "none");
    assert!(json["payload"]["view_filter"]["ids"].is_null());

    let restored: WasmQueryRequest = serde_json::from_value(json).unwrap();
    assert_eq!(restored, request);
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
        WasmCommandRequest::DeleteSlot(WasmDeleteSlotPayload {
            slot_id: "slot-1001".into(),
        })
    );
    assert_eq!(
        query,
        WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
            view_filter: None,
            visible_start_minute: None,
            visible_end_minute: None,
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
fn wasm_query_request_rejects_legacy_assignee_filter_field() {
    let legacy_query_json = r#"{
        "query":"weekly_layout",
        "payload":{
            "anchor_date":"2026-05-07",
            "assignee_id":"owner-42"
        }
    }"#;

    assert!(parse_query_request(legacy_query_json).is_err());
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
            "resource_owner_id":"owner-42",
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
            "resource_owner_id":"owner-42",
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
fn wasm_adapter_wrapper_maps_business_error_for_duplicate_slot_id() {
    let mut adapter = WasmSchedulerAdapter::new();
    let add_slot_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T09:30:00Z",
            "resource_owner_id":"owner-42",
            "created_by":"admin-7"
        }
    }"#;

    adapter.execute_command_json(add_slot_json);
    let response = adapter.execute_command_json(add_slot_json);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "error");
    assert_eq!(payload["error"]["category"], "business");
    assert_eq!(payload["error"]["code"], "slot_id_already_exists");
}

#[test]
fn wasm_adapter_wrapper_maps_business_error_for_duplicate_appointment_id() {
    let mut adapter = WasmSchedulerAdapter::new();
    let add_slot_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T09:30:00Z",
            "resource_owner_id":"owner-42",
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
    let duplicate_id_json = r#"{
        "command":"add_appointment",
        "payload":{
            "appointment_id":"appt-9001",
            "slot_id":"slot-1001",
            "invitee_ids":["patient-88"],
            "title":"Second Attempt",
            "created_by":"staff-3"
        }
    }"#;

    adapter.execute_command_json(add_slot_json);
    adapter.execute_command_json(add_appointment_json);
    let response = adapter.execute_command_json(duplicate_id_json);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "error");
    assert_eq!(payload["error"]["category"], "business");
    assert_eq!(payload["error"]["code"], "appointment_id_already_exists");
}

#[test]
fn wasm_adapter_wrapper_maps_business_error_for_unauthorized_appointment_cancellation() {
    let mut adapter = WasmSchedulerAdapter::new();
    let add_slot_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T09:30:00Z",
            "resource_owner_id":"owner-42",
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
    let cancel_appointment_json = r#"{
        "command":"cancel_appointment",
        "payload":{
            "appointment_id":"appt-9001",
            "cancelled_by":"stranger-1"
        }
    }"#;

    adapter.execute_command_json(add_slot_json);
    adapter.execute_command_json(add_appointment_json);

    let response = adapter.execute_command_json(cancel_appointment_json);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "error");
    assert_eq!(payload["error"]["category"], "business");
    assert_eq!(payload["error"]["code"], "appointment_cancel_not_allowed");
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
            "resource_owner_id":"owner-42",
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
            "anchor_date":"2026-05-07",
            "view_filter":{"mode":"owners","ids":["owner-42"]},
            "visible_start_minute":540,
            "visible_end_minute":570
        }
    }"#;

    adapter.execute_command_json(add_slot_json);
    adapter.execute_command_json(add_appointment_json);

    let response = adapter.execute_query_json(query_json);

    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "success");
    assert_eq!(payload["data"]["week_start"], "2026-05-04");
    assert_eq!(payload["data"]["appointments"][0]["slot_id"], "slot-1001");
    assert_eq!(
        payload["data"]["appointments"][0]["appointment_id"],
        "appt-9001"
    );
}

#[test]
fn wasm_adapter_wrapper_treats_empty_owners_filter_as_none() {
    let mut adapter = WasmSchedulerAdapter::new();
    let add_slot_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T09:30:00Z",
            "resource_owner_id":"owner-42",
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
            "anchor_date":"2026-05-07",
            "view_filter":{"mode":"owners","ids":[]}
        }
    }"#;

    adapter.execute_command_json(add_slot_json);
    adapter.execute_command_json(add_appointment_json);

    let response = adapter.execute_query_json(query_json);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "success");
    assert_eq!(payload["data"]["slots"].as_array().unwrap().len(), 0);
    assert_eq!(payload["data"]["appointments"].as_array().unwrap().len(), 0);
}

#[test]
fn wasm_adapter_wrapper_applies_none_filter_mode() {
    let mut adapter = WasmSchedulerAdapter::new();
    let add_slot_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T09:30:00Z",
            "resource_owner_id":"owner-42",
            "created_by":"admin-7"
        }
    }"#;
    let query_json = r#"{
        "query":"weekly_layout",
        "payload":{
            "anchor_date":"2026-05-07",
            "view_filter":{"mode":"none"}
        }
    }"#;

    adapter.execute_command_json(add_slot_json);

    let response = adapter.execute_query_json(query_json);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "success");
    assert_eq!(payload["data"]["slots"].as_array().unwrap().len(), 0);
    assert_eq!(payload["data"]["appointments"].as_array().unwrap().len(), 0);
}

#[test]
fn wasm_adapter_wrapper_normalizes_timezone_aware_weekly_query_anchor() {
    let adapter = WasmSchedulerAdapter::new();

    let legacy_response =
        adapter.execute_query(WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 5).unwrap(),
            view_filter: None,
            visible_start_minute: None,
            visible_end_minute: None,
            timezone: None,
        }));
    let timezone_response =
        adapter.execute_query(WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 5).unwrap(),
            view_filter: None,
            visible_start_minute: None,
            visible_end_minute: None,
            timezone: Some("Europe/Paris".to_string()),
        }));

    let legacy_week_start = match legacy_response {
        WasmQueryResponse::Success { data } => data.week_start,
        WasmQueryResponse::Error { error } => panic!("unexpected error: {error:?}"),
    };
    let timezone_week_start = match timezone_response {
        WasmQueryResponse::Success { data } => data.week_start,
        WasmQueryResponse::Error { error } => panic!("unexpected error: {error:?}"),
    };

    assert_eq!(
        legacy_week_start,
        NaiveDate::from_ymd_opt(2026, 1, 5).unwrap()
    );
    assert_eq!(
        timezone_week_start,
        NaiveDate::from_ymd_opt(2025, 12, 29).unwrap()
    );
}

#[test]
fn wasm_adapter_wrapper_returns_deterministic_error_for_invalid_timezone() {
    let adapter = WasmSchedulerAdapter::new();

    let response = adapter.execute_query(WasmQueryRequest::WeeklyLayout(WasmWeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 1, 5).unwrap(),
        view_filter: None,
        visible_start_minute: None,
        visible_end_minute: None,
        timezone: Some("Not/A_Real_TZ".to_string()),
    }));

    let error = match response {
        WasmQueryResponse::Success { data } => panic!("unexpected success: {data:?}"),
        WasmQueryResponse::Error { error } => error,
    };

    assert_eq!(error.category, WasmErrorCategory::Contract);
    assert_eq!(error.code, "invalid_timezone");
    assert_eq!(error.message, "invalid timezone value");
}

#[test]
fn wasm_adapter_wrapper_maps_invalid_visible_window_to_structural_error() {
    let adapter = WasmSchedulerAdapter::new();
    let query_json = r#"{
        "query":"weekly_layout",
        "payload":{
            "anchor_date":"2026-05-07",
            "visible_start_minute":600,
            "visible_end_minute":600
        }
    }"#;

    let response = adapter.execute_query_json(query_json);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "error");
    assert_eq!(payload["error"]["category"], "structural");
    assert_eq!(payload["error"]["code"], "invalid_visible_window");
}

#[test]
fn wasm_adapter_wrapper_returns_clipped_slot_nodes_for_visible_window() {
    let mut adapter = WasmSchedulerAdapter::new();
    let slot_one_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1001",
            "start":"2026-05-04T09:00:00Z",
            "end":"2026-05-04T10:00:00Z",
            "resource_owner_id":"owner-42",
            "created_by":"admin-7"
        }
    }"#;
    let slot_two_json = r#"{
        "command":"add_slot",
        "payload":{
            "slot_id":"slot-1002",
            "start":"2026-05-04T11:00:00Z",
            "end":"2026-05-04T12:00:00Z",
            "resource_owner_id":"owner-42",
            "created_by":"admin-7"
        }
    }"#;
    let query_json = r#"{
        "query":"weekly_layout",
        "payload":{
            "anchor_date":"2026-05-07",
            "visible_start_minute":570,
            "visible_end_minute":690
        }
    }"#;

    adapter.execute_command_json(slot_one_json);
    adapter.execute_command_json(slot_two_json);
    let response = adapter.execute_query_json(query_json);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "success");
    assert_eq!(payload["data"]["slots"].as_array().unwrap().len(), 2);
    assert_eq!(payload["data"]["slots"][0]["slot_id"], "slot-1001");
    assert_eq!(payload["data"]["slots"][0]["start_minute"], 570);
    assert_eq!(payload["data"]["slots"][0]["end_minute"], 600);
    assert_eq!(payload["data"]["slots"][0]["clipped_start"], true);
    assert_eq!(payload["data"]["slots"][0]["clipped_end"], false);
    assert_eq!(payload["data"]["slots"][1]["slot_id"], "slot-1002");
    assert_eq!(payload["data"]["slots"][1]["start_minute"], 660);
    assert_eq!(payload["data"]["slots"][1]["end_minute"], 690);
    assert_eq!(payload["data"]["slots"][1]["clipped_start"], false);
    assert_eq!(payload["data"]["slots"][1]["clipped_end"], true);
}

#[test]
fn wasm_adapter_wrapper_maps_invalid_timezone_to_error_envelope_in_json_entrypoint() {
    let adapter = WasmSchedulerAdapter::new();
    let query_json = r#"{
        "query":"weekly_layout",
        "payload":{
            "anchor_date":"2026-01-05",
            "timezone":"Not/A_Real_TZ"
        }
    }"#;

    let response = adapter.execute_query_json(query_json);
    let payload: serde_json::Value = serde_json::from_str(&response).unwrap();

    assert_eq!(payload["status"], "error");
    assert_eq!(payload["error"]["category"], "contract");
    assert_eq!(payload["error"]["code"], "invalid_timezone");
    assert_eq!(payload["error"]["message"], "invalid timezone value");
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
fn wasm_adapter_error_conversion_is_deterministic_for_cancel_authorization_error() {
    let error = WasmAdapterError::from_scheduler_error(SchedulerError::Business(
        BusinessRuleError::AppointmentCancelNotAllowed,
    ));
    assert_eq!(error.category, WasmErrorCategory::Business);
    assert_eq!(error.code, "appointment_cancel_not_allowed");
    assert_eq!(
        error.message,
        "appointment cancellation is not allowed for this actor"
    );
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
            "resource_owner_id":"owner-42",
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
