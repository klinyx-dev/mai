import type {
  BookSlotCommandInput,
  BuildAppointmentTitleInput,
  AnyCommandEnvelope,
  CommandPayloadMap,
  CommandName,
  CommandEnvelope,
  TypedCommandEnvelope,
  QueryName,
  QueryPayloadMap,
  QueryEnvelope,
  TypedQueryEnvelope,
  WasmResponse,
  WeeklyLayout,
  WeeklyLayoutQueryPayload,
} from "./types.js";
import { COMMANDS, QUERIES } from "./types.js";

export interface JsonAdapter {
  execute_command_json(input: string): string;
  execute_query_json(input: string): string;
}

export interface MaiClient {
  executeCommand(command: AnyCommandEnvelope): WasmResponse<"applied">;
  queryWeeklyLayout(payload: WeeklyLayoutQueryPayload): WasmResponse<WeeklyLayout>;
  bookSlot(input: BookSlotCommandInput): WasmResponse<"applied">;
  parseResponse<T>(input: string): WasmResponse<T>;
}

export function createCommandEnvelope<TCommand extends CommandName>(
  command: TCommand,
  payload: CommandPayloadMap[TCommand]
): TypedCommandEnvelope<TCommand> {
  return { command, payload };
}

export function createQueryEnvelope<TQuery extends QueryName>(
  query: TQuery,
  payload: QueryPayloadMap[TQuery]
): TypedQueryEnvelope<TQuery> {
  return { query, payload };
}

export function buildAppointmentTitle(
  input: BuildAppointmentTitleInput
): string {
  return `${input.userDisplayName.trim()} - ${input.reason.trim()}`;
}

export function createBookSlotCommand(
  input: BookSlotCommandInput
): TypedCommandEnvelope<typeof COMMANDS.ADD_APPOINTMENT> {
  return createCommandEnvelope(COMMANDS.ADD_APPOINTMENT, {
    appointment_id: input.appointmentId,
    slot_id: input.slotId,
    invitee_ids: [input.inviteeId],
    title: buildAppointmentTitle(input),
    created_by: input.createdBy,
  });
}

export function executeCommand<TCommand extends CommandName>(
  adapter: JsonAdapter,
  command: TypedCommandEnvelope<TCommand>
): WasmResponse<"applied">;
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

export function createMaiClient(adapter: JsonAdapter): MaiClient {
  return {
    executeCommand(command: AnyCommandEnvelope) {
      return executeCommand(adapter, command);
    },
    queryWeeklyLayout(payload: WeeklyLayoutQueryPayload) {
      return executeWeeklyLayoutQuery(adapter, payload);
    },
    bookSlot(input: BookSlotCommandInput) {
      return executeCommand(adapter, createBookSlotCommand(input));
    },
    parseResponse<T>(input: string) {
      return parseJsonResponse<T>(input);
    },
  };
}
