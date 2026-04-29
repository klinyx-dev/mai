import { computed, type ComputedRef } from "vue";
import {
  buildAddAppointmentCommand,
  buildAddSlotCommand,
  buildCancelAppointmentCommand,
  buildCancelSlotCommand,
  buildDeleteAppointmentCommand,
  buildDeleteSlotCommand,
  buildRescheduleSlotCommand,
  type CommandModeOptions,
} from "./command-mode";
import { startOfWeekIso } from "../board/model/view-model";
import type {
  AppointmentActionEventPayload,
  CreateSlotActionEventPayload,
  MaiActionRunner,
  SlotActionEventPayload,
  SlotRescheduleActionEventPayload,
  TimeLabelFormat,
} from "../types";
import type { AnyCommandEnvelope } from "@mai/mai-web-core";
import type {
  PartialActionConfig,
  PartialActorConfig,
  PartialViewConfig,
} from "./board-interactive-contract";

const DEFAULT_RESOLVED_VIEW = {
  title: "Availability",
  subtitle: "Weekly planning",
  visibleStartMinute: 0,
  visibleEndMinute: 1440,
  timeLabelFormat: "24h" as TimeLabelFormat,
  emptyStateText: "No events",
};

const DEFAULT_RESOLVED_ACTOR = {
  resourceOwnerId: "",
  createdBy: "",
  defaultSlotDurationMinutes: 30,
  appointmentIdFactory: (slotId: string) => `appt-${slotId}-${Date.now()}`,
  bookAppointmentInviteeIds: [] as string[],
  bookAppointmentTitle: "Consultation",
  bookAppointmentCreatedBy: "",
  cancelAppointmentBy: "",
};

export function buildResolvedView(args: {
  view: PartialViewConfig | null;
}): ComputedRef<{
  title: string;
  subtitle: string;
  visibleStartMinute: number;
  visibleEndMinute: number;
  timeLabelFormat: TimeLabelFormat;
  emptyStateText: string;
}> {
  return computed(() => ({
    title: args.view?.title ?? DEFAULT_RESOLVED_VIEW.title,
    subtitle: args.view?.subtitle ?? DEFAULT_RESOLVED_VIEW.subtitle,
    visibleStartMinute: args.view?.visibleStartMinute ?? DEFAULT_RESOLVED_VIEW.visibleStartMinute,
    visibleEndMinute: args.view?.visibleEndMinute ?? DEFAULT_RESOLVED_VIEW.visibleEndMinute,
    timeLabelFormat: args.view?.timeLabelFormat ?? DEFAULT_RESOLVED_VIEW.timeLabelFormat,
    emptyStateText: args.view?.emptyStateText ?? DEFAULT_RESOLVED_VIEW.emptyStateText,
  }));
}

export function buildResolvedActor(args: {
  actor: PartialActorConfig | null;
}): ComputedRef<{
  resourceOwnerId: string;
  createdBy: string;
  defaultSlotDurationMinutes: number;
  appointmentIdFactory: (slotId: string) => string;
  bookAppointmentInviteeIds: string[];
  bookAppointmentTitle: string;
  bookAppointmentCreatedBy: string;
  cancelAppointmentBy: string;
}> {
  return computed(() => ({
    resourceOwnerId: args.actor?.resourceOwnerId ?? DEFAULT_RESOLVED_ACTOR.resourceOwnerId,
    createdBy: args.actor?.createdBy ?? DEFAULT_RESOLVED_ACTOR.createdBy,
    defaultSlotDurationMinutes:
      args.actor?.defaultSlotDurationMinutes ?? DEFAULT_RESOLVED_ACTOR.defaultSlotDurationMinutes,
    appointmentIdFactory:
      args.actor?.appointmentIdFactory ?? DEFAULT_RESOLVED_ACTOR.appointmentIdFactory,
    bookAppointmentInviteeIds:
      args.actor?.bookAppointmentInviteeIds ?? DEFAULT_RESOLVED_ACTOR.bookAppointmentInviteeIds,
    bookAppointmentTitle:
      args.actor?.bookAppointmentTitle ?? DEFAULT_RESOLVED_ACTOR.bookAppointmentTitle,
    bookAppointmentCreatedBy:
      args.actor?.bookAppointmentCreatedBy ?? DEFAULT_RESOLVED_ACTOR.bookAppointmentCreatedBy,
    cancelAppointmentBy:
      args.actor?.cancelAppointmentBy ?? DEFAULT_RESOLVED_ACTOR.cancelAppointmentBy,
  }));
}

export function buildResolvedMutateCommand(args: {
  actions: ComputedRef<PartialActionConfig | null>;
}): ComputedRef<MaiActionRunner<AnyCommandEnvelope> | null> {
  return computed(() => args.actions.value?.mutateCommand ?? null);
}

export function buildCommandModeOptions(args: {
  actor: ComputedRef<{
    createdBy: string;
    appointmentIdFactory: (slotId: string) => string;
    bookAppointmentInviteeIds: string[];
    bookAppointmentTitle: string;
    bookAppointmentCreatedBy: string;
    cancelAppointmentBy: string;
  }>;
  weekStartIso: ComputedRef<string>;
}): ComputedRef<CommandModeOptions> {
  return computed(() => ({
    createdBy: args.actor.value.createdBy,
    appointmentIdFactory: args.actor.value.appointmentIdFactory,
    bookAppointmentInviteeIds: args.actor.value.bookAppointmentInviteeIds,
    bookAppointmentTitle: args.actor.value.bookAppointmentTitle,
    bookAppointmentCreatedBy: args.actor.value.bookAppointmentCreatedBy,
    cancelAppointmentBy: args.actor.value.cancelAppointmentBy,
    weekStartIso: args.weekStartIso.value,
  }));
}

export function buildWeekStartIso(args: {
  layoutWeekStart: ComputedRef<string | null>;
  anchorDate: string;
}): ComputedRef<string> {
  return computed(
    () => args.layoutWeekStart.value ?? startOfWeekIso(args.anchorDate)
  );
}

export function buildCreateSlotHandler(args: {
  actions: ComputedRef<PartialActionConfig | null>;
  mutate: ComputedRef<MaiActionRunner<AnyCommandEnvelope> | null>;
}): ComputedRef<MaiActionRunner<CreateSlotActionEventPayload> | null> {
  return computed(
    () =>
      args.actions.value?.createSlot ??
      (args.mutate.value
        ? async (payload) => args.mutate.value!(buildAddSlotCommand(payload))
        : null)
  );
}

export function buildBookSlotHandler(args: {
  actions: ComputedRef<PartialActionConfig | null>;
  mutate: ComputedRef<MaiActionRunner<AnyCommandEnvelope> | null>;
  options: ComputedRef<CommandModeOptions>;
}): ComputedRef<MaiActionRunner<SlotActionEventPayload> | null> {
  return computed(
    () =>
      args.actions.value?.bookSlot ??
      (args.mutate.value
        ? async (payload) =>
            args.mutate.value!(
              buildAddAppointmentCommand(payload, args.options.value)
            )
        : null)
  );
}

export function buildRescheduleSlotHandler(args: {
  actions: ComputedRef<PartialActionConfig | null>;
  mutate: ComputedRef<MaiActionRunner<AnyCommandEnvelope> | null>;
  options: ComputedRef<CommandModeOptions>;
}): ComputedRef<MaiActionRunner<SlotRescheduleActionEventPayload> | null> {
  return computed(
    () =>
      args.actions.value?.rescheduleSlot ??
      (args.mutate.value
        ? async (payload) =>
            args.mutate.value!(
              buildRescheduleSlotCommand(payload, args.options.value)
            )
        : null)
  );
}

export function buildCancelSlotHandler(args: {
  actions: ComputedRef<PartialActionConfig | null>;
  mutate: ComputedRef<MaiActionRunner<AnyCommandEnvelope> | null>;
}): ComputedRef<MaiActionRunner<SlotActionEventPayload> | null> {
  return computed(
    () =>
      args.actions.value?.cancelSlot ??
      (args.mutate.value
        ? async (payload) => args.mutate.value!(buildCancelSlotCommand(payload))
        : null)
  );
}

export function buildDeleteSlotHandler(args: {
  actions: ComputedRef<PartialActionConfig | null>;
  mutate: ComputedRef<MaiActionRunner<AnyCommandEnvelope> | null>;
}): ComputedRef<MaiActionRunner<SlotActionEventPayload> | null> {
  return computed(
    () =>
      args.actions.value?.deleteSlot ??
      (args.mutate.value
        ? async (payload) => args.mutate.value!(buildDeleteSlotCommand(payload))
        : null)
  );
}

export function buildCancelAppointmentHandler(args: {
  actions: ComputedRef<PartialActionConfig | null>;
  mutate: ComputedRef<MaiActionRunner<AnyCommandEnvelope> | null>;
  options: ComputedRef<CommandModeOptions>;
}): ComputedRef<MaiActionRunner<AppointmentActionEventPayload> | null> {
  return computed(
    () =>
      args.actions.value?.cancelAppointment ??
      (args.mutate.value
        ? async (payload) =>
            args.mutate.value!(
              buildCancelAppointmentCommand(payload, args.options.value)
            )
        : null)
  );
}

export function buildDeleteAppointmentHandler(args: {
  actions: ComputedRef<PartialActionConfig | null>;
  mutate: ComputedRef<MaiActionRunner<AnyCommandEnvelope> | null>;
}): ComputedRef<MaiActionRunner<AppointmentActionEventPayload> | null> {
  return computed(
    () =>
      args.actions.value?.deleteAppointment ??
      (args.mutate.value
        ? async (payload) => args.mutate.value!(buildDeleteAppointmentCommand(payload))
        : null)
  );
}
