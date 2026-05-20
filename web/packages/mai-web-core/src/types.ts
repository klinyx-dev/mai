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

export type WeeklyViewFilterMode = "all" | "none" | "owners" | "group";

export type WeeklyViewFilter =
  | { mode: "all" }
  | { mode: "none" }
  | {
      mode: "owners" | "group";
      // Empty IDs remain a deterministic "none selected" contract at the core boundary.
      ids: string[];
    };

export type WasmResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: WasmAdapterError };

export interface WeeklyLayoutQueryPayload {
  anchor_date: string;
  timezone?: string;
  view_filter?: WeeklyViewFilter;
  visible_start_minute?: number;
  visible_end_minute?: number;
}

export const COMMANDS = {
  ADD_SLOT: "add_slot",
  ADD_SLOTS_BATCH: "add_slots_batch",
  ADD_RECURRING_TEMPLATE: "add_recurring_template",
  APPLY_RECURRING_TEMPLATES: "apply_recurring_templates",
  ADD_BLACKOUT_WINDOW: "add_blackout_window",
  RESCHEDULE_SLOT: "reschedule_slot",
  DELETE_SLOT: "delete_slot",
  CANCEL_SLOT: "cancel_slot",
  ADD_APPOINTMENT: "add_appointment",
  CANCEL_APPOINTMENT: "cancel_appointment",
  DELETE_APPOINTMENT: "delete_appointment",
} as const;

export type CommandName = (typeof COMMANDS)[keyof typeof COMMANDS];

export interface AddSlotCommandPayload {
  slot_id: string;
  start: string;
  end: string;
  resource_owner_id: string;
  created_by: string;
}

export interface DeleteSlotCommandPayload {
  slot_id: string;
}

export type BatchMode = "atomic" | "best_effort";

export interface AddSlotsBatchCommandPayload {
  mode: BatchMode;
  slots: AddSlotCommandPayload[];
}

export interface AddRecurringTemplateCommandPayload {
  template_id: string;
  resource_owner_id: string;
  weekday: number;
  start_minute: number;
  end_minute: number;
  effective_from: string;
  effective_until: string;
  created_by: string;
}

export interface ApplyRecurringTemplatesCommandPayload {
  week_start: string;
  owner_ids: string[];
  dry_run: boolean;
  created_by: string;
}

export interface AddBlackoutWindowCommandPayload {
  blackout_id: string;
  resource_owner_id: string;
  start: string;
  end: string;
  reason: string;
  created_by: string;
}

export interface RescheduleSlotCommandPayload {
  slot_id: string;
  new_start: string;
  new_end: string;
  updated_by: string;
}

export interface CancelSlotCommandPayload {
  slot_id: string;
}

export interface AddAppointmentCommandPayload {
  appointment_id: string;
  slot_id: string;
  invitee_ids: string[];
  title: string;
  created_by: string;
}

export interface BuildAppointmentTitleInput {
  userDisplayName: string;
  reason: string;
}

export interface BookSlotCommandInput extends BuildAppointmentTitleInput {
  appointmentId: string;
  slotId: string;
  inviteeId: string;
  createdBy: string;
}

export interface CancelAppointmentCommandPayload {
  appointment_id: string;
  cancelled_by: string;
}

export interface DeleteAppointmentCommandPayload {
  appointment_id: string;
}

export interface CommandPayloadMap {
  [COMMANDS.ADD_SLOT]: AddSlotCommandPayload;
  [COMMANDS.ADD_SLOTS_BATCH]: AddSlotsBatchCommandPayload;
  [COMMANDS.ADD_RECURRING_TEMPLATE]: AddRecurringTemplateCommandPayload;
  [COMMANDS.APPLY_RECURRING_TEMPLATES]: ApplyRecurringTemplatesCommandPayload;
  [COMMANDS.ADD_BLACKOUT_WINDOW]: AddBlackoutWindowCommandPayload;
  [COMMANDS.RESCHEDULE_SLOT]: RescheduleSlotCommandPayload;
  [COMMANDS.DELETE_SLOT]: DeleteSlotCommandPayload;
  [COMMANDS.CANCEL_SLOT]: CancelSlotCommandPayload;
  [COMMANDS.ADD_APPOINTMENT]: AddAppointmentCommandPayload;
  [COMMANDS.CANCEL_APPOINTMENT]: CancelAppointmentCommandPayload;
  [COMMANDS.DELETE_APPOINTMENT]: DeleteAppointmentCommandPayload;
}

export const QUERIES = {
  WEEKLY_LAYOUT: "weekly_layout",
} as const;

export type QueryName = (typeof QUERIES)[keyof typeof QUERIES];

export interface QueryPayloadMap {
  [QUERIES.WEEKLY_LAYOUT]: WeeklyLayoutQueryPayload;
}

export interface CommandEnvelope<TPayload extends object> {
  command: CommandName;
  payload: TPayload;
}

export type TypedCommandEnvelope<TCommand extends CommandName> = {
  command: TCommand;
  payload: CommandPayloadMap[TCommand];
};

export type AnyCommandEnvelope = {
  [TCommand in CommandName]: TypedCommandEnvelope<TCommand>;
}[CommandName];

export interface QueryEnvelope<TPayload extends object> {
  query: QueryName;
  payload: TPayload;
}

export type TypedQueryEnvelope<TQuery extends QueryName> = {
  query: TQuery;
  payload: QueryPayloadMap[TQuery];
};
