use mai::adapters::wasm::WasmBindgenAdapter;

#[test]
fn web_consumer_smoke_flow_covers_success_and_error_envelopes() {
    let mut adapter = WasmBindgenAdapter::new();

    let add_slot_response = adapter.execute_command_json(
        r#"{
            "command":"add_slot",
            "payload":{
                "slot_id":"slot-1001",
                "start":"2026-05-04T09:00:00Z",
                "end":"2026-05-04T09:30:00Z",
                "assignee_id":"doctor-42",
                "created_by":"admin-7"
            }
        }"#,
    );
    let add_slot_json: serde_json::Value = serde_json::from_str(&add_slot_response).unwrap();
    assert_eq!(add_slot_json["status"], "success");
    assert_eq!(add_slot_json["data"], "applied");

    let add_appointment_response = adapter.execute_command_json(
        r#"{
            "command":"add_appointment",
            "payload":{
                "appointment_id":"appt-9001",
                "slot_id":"slot-1001",
                "invitee_ids":["patient-77"],
                "title":"Follow-up Consultation",
                "created_by":"staff-3"
            }
        }"#,
    );
    let add_appointment_json: serde_json::Value =
        serde_json::from_str(&add_appointment_response).unwrap();
    assert_eq!(add_appointment_json["status"], "success");

    let weekly_query_response = adapter.execute_query_json(
        r#"{
            "query":"weekly_layout",
            "payload":{
                "anchor_date":"2026-05-07"
            }
        }"#,
    );
    let weekly_query_json: serde_json::Value = serde_json::from_str(&weekly_query_response).unwrap();
    assert_eq!(weekly_query_json["status"], "success");
    assert_eq!(weekly_query_json["data"]["week_start"], "2026-05-04");
    assert_eq!(
        weekly_query_json["data"]["appointments"][0]["appointment_id"],
        "appt-9001"
    );

    // Repeat booking to prove consumer-visible business error envelope shape.
    let duplicate_booking_response = adapter.execute_command_json(
        r#"{
            "command":"add_appointment",
            "payload":{
                "appointment_id":"appt-9002",
                "slot_id":"slot-1001",
                "invitee_ids":["patient-88"],
                "title":"Second Booking Attempt",
                "created_by":"staff-3"
            }
        }"#,
    );
    let duplicate_booking_json: serde_json::Value =
        serde_json::from_str(&duplicate_booking_response).unwrap();
    assert_eq!(duplicate_booking_json["status"], "error");
    assert_eq!(duplicate_booking_json["error"]["category"], "business");
    assert_eq!(duplicate_booking_json["error"]["code"], "slot_already_booked");
}

