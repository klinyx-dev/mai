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

export type CommandName =
  | "add_slot"
  | "delete_slot"
  | "cancel_slot"
  | "add_appointment"
  | "delete_appointment";

export interface CommandEnvelope<TPayload extends object> {
  command: CommandName;
  payload: TPayload;
}

export interface QueryEnvelope<TPayload extends object> {
  query: "weekly_layout";
  payload: TPayload;
}
