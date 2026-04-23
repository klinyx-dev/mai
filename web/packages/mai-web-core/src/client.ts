import type {
  CommandName,
  CommandEnvelope,
  QueryName,
  QueryEnvelope,
  WasmResponse,
  WeeklyLayout,
  WeeklyLayoutQueryPayload,
} from "./types.js";
import { QUERIES } from "./types.js";

export interface JsonAdapter {
  execute_command_json(input: string): string;
  execute_query_json(input: string): string;
}

export function createCommandEnvelope<TPayload extends object>(
  command: CommandName,
  payload: TPayload
): CommandEnvelope<TPayload> {
  return { command, payload };
}

export function createQueryEnvelope<TPayload extends object>(
  query: QueryName,
  payload: TPayload
): QueryEnvelope<TPayload> {
  return { query, payload };
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
  const query = createQueryEnvelope(QUERIES.WEEKLY_LAYOUT, payload);

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
