use super::{WasmCommandRequest, WasmCommandResponse, WasmQueryRequest, WasmQueryResponse};

// Parse a command request from a JSON string
pub fn parse_command_request(input: &str) -> Result<WasmCommandRequest, serde_json::Error> {
    serde_json::from_str(input)
}

// Parse a query request from a JSON string
pub fn parse_query_request(input: &str) -> Result<WasmQueryRequest, serde_json::Error> {
    serde_json::from_str(input)
}

// Render a command response as a JSON string
pub fn render_command_response(
    response: &WasmCommandResponse,
) -> Result<String, serde_json::Error> {
    serde_json::to_string(response)
}

// Render a query response as a JSON string
pub fn render_query_response(response: &WasmQueryResponse) -> Result<String, serde_json::Error> {
    serde_json::to_string(response)
}
