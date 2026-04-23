export type WasmErrorCategory = "structural" | "referential" | "business" | "contract";

export interface WasmAdapterError {
  category: WasmErrorCategory;
  code: string;
  message: string;
}

export interface SlotLayoutNode {
  slot_id: string;
  day_index: number;
  start_minute: number;
  end_minute: number;
  clipped_start: boolean;
  clipped_end: boolean;
}

export interface AppointmentLayoutNode {
  appointment_id: string;
  slot_id: string;
  day_index: number;
  start_minute: number;
  end_minute: number;
  clipped_start: boolean;
  clipped_end: boolean;
}

export interface WeeklyLayout {
  week_start: string;
  week_end: string;
  slots: SlotLayoutNode[];
  appointments: AppointmentLayoutNode[];
}

export type WasmResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: WasmAdapterError };

export interface WeeklyLayoutQueryPayload {
  anchor_date: string;
  timezone?: string;
  assignee_id?: string;
  visible_start_minute?: number;
  visible_end_minute?: number;
}

export const COMMANDS = {
  ADD_SLOT: "add_slot",
  DELETE_SLOT: "delete_slot",
  CANCEL_SLOT: "cancel_slot",
  ADD_APPOINTMENT: "add_appointment",
  CANCEL_APPOINTMENT: "cancel_appointment",
  DELETE_APPOINTMENT: "delete_appointment",
} as const;

export type CommandName = (typeof COMMANDS)[keyof typeof COMMANDS];

export const QUERIES = {
  WEEKLY_LAYOUT: "weekly_layout",
} as const;

export type QueryName = (typeof QUERIES)[keyof typeof QUERIES];

export interface CommandEnvelope<TPayload extends object> {
  command: CommandName;
  payload: TPayload;
}

export interface QueryEnvelope<TPayload extends object> {
  query: QueryName;
  payload: TPayload;
}
