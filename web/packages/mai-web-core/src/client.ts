import type {
  CommandEnvelope,
  QueryEnvelope,
  WasmResponse,
  WeeklyLayout,
  WeeklyLayoutQueryPayload,
} from "./types";

export interface JsonAdapter {
  execute_command_json(input: string): string;
  execute_query_json(input: string): string;
}

export function executeCommand<TPayload extends object>(
  adapter: JsonAdapter,
  command: CommandEnvelope<TPayload>
): WasmResponse<"applied"> {
  return parseJsonResponse<"applied">(
    adapter.execute_command_json(JSON.stringify(command))
  );
}

export function executeWeeklyLayoutQuery(
  adapter: JsonAdapter,
  payload: WeeklyLayoutQueryPayload
): WasmResponse<WeeklyLayout> {
  const query: QueryEnvelope<WeeklyLayoutQueryPayload> = {
    query: "weekly_layout",
    payload,
  };

  return parseJsonResponse<WeeklyLayout>(
    adapter.execute_query_json(JSON.stringify(query))
  );
}

export function parseJsonResponse<T>(input: string): WasmResponse<T> {
  const parsed = JSON.parse(input) as WasmResponse<T>;
  if (!parsed || (parsed.status !== "success" && parsed.status !== "error")) {
    throw new Error("invalid mai adapter response envelope");
  }
  return parsed;
}
