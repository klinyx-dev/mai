import type {
  AppointmentActionEventPayload,
  CreateBlackoutActionEventPayload,
  CreateSlotActionEventPayload,
  SlotActionEventPayload,
  SlotRescheduleActionEventPayload,
} from "./types/actions";
import type { MaiBookingActionConfig } from "./features/booking/MaiBookingFlow";
import type {
  AppointmentClickEventPayload,
  EmptyCellClickEventPayload,
  InteractionAnchorRect,
  SlotClickEventPayload,
  SlotDraftPreview as BoardSlotDraftPreview,
  TimeLabelFormat as BoardTimeLabelFormat,
  WeekShift as BoardWeekShift,
} from "./types/board";
import type {
  MaiBookSlotPayload,
  MaiBookingActorConfig,
  MaiBookingAuthIdentity,
  MaiBookingAvailabilitySlot,
  MaiBookingCategory,
  MaiBookingConfig,
  MaiBookingContext,
  MaiBookingCopy,
  MaiBookingError,
  MaiBookingFlowEvent,
  MaiBookingFlowState,
  MaiBookingLocation,
  MaiBookingMetadata,
  MaiBookingResource,
  MaiBookingSlotOwner,
  MaiBookingSlotSelection,
  MaiBookingSlotStatus,
  MaiBookingSlotVisibility,
  MaiBookingStep,
  MaiBookingViewConfig,
} from "./types/booking";
import type {
  MaiActionRunner,
  MaiActionVisibility,
  MaiAppointmentChangedEventPayload,
  MaiBlackoutCreatedEventPayload,
  MaiBoardInteractiveActionConfig,
  MaiBoardInteractiveActorConfig,
  MaiBoardInteractiveEvent,
  MaiBoardInteractiveViewConfig,
  MaiBoardMode,
  MaiCalendarFilterOwnerOption,
  MaiInteractionAction,
  MaiInteractionErrorPayload,
  MaiInteractionSuccessEvent,
  MaiSlotChangedEventPayload,
  MaiSlotCreatedEventPayload,
  MaiSlotRescheduledEventPayload,
  MaiViewFilter,
  MaiViewFilterMode,
  MaiViewFilterOption,
} from "./types/interactive";

export declare namespace MaiBooking {
  export type Step = MaiBookingStep;
  export type SlotStatus = MaiBookingSlotStatus;
  export type SlotVisibility = MaiBookingSlotVisibility;
  export type Metadata = MaiBookingMetadata;
  export type Context = MaiBookingContext;
  export type Location = MaiBookingLocation;
  export type Category = MaiBookingCategory;
  export type Resource = MaiBookingResource;
  export type SlotSelection = MaiBookingSlotSelection;
  export type AvailabilitySlot = MaiBookingAvailabilitySlot;
  export type SlotOwner = MaiBookingSlotOwner;
  export type ViewConfig = MaiBookingViewConfig;
  export type ActorConfig = MaiBookingActorConfig;
  export type Config = MaiBookingConfig;
  export type ActionConfig = MaiBookingActionConfig;
  export type Copy = MaiBookingCopy;
  export type BookSlotPayload = MaiBookSlotPayload;
  export type AuthIdentity = MaiBookingAuthIdentity;
  export type Error = MaiBookingError;
  export type State = MaiBookingFlowState;
  export type Event = MaiBookingFlowEvent;
}

export declare namespace MaiInteractive {
  export type WeekShift = BoardWeekShift;
  export type TimeLabelFormat = BoardTimeLabelFormat;
  export type AnchorRect = InteractionAnchorRect;
  export type SlotClickPayload = SlotClickEventPayload;
  export type AppointmentClickPayload = AppointmentClickEventPayload;
  export type EmptyCellClickPayload = EmptyCellClickEventPayload;
  export type SlotDraftPreview = BoardSlotDraftPreview;
  export type Action = MaiInteractionAction;
  export type ActionVisibility = MaiActionVisibility;
  export type ActionRunner<TPayload> = MaiActionRunner<TPayload>;
  export type SuccessEvent = MaiInteractionSuccessEvent;
  export type Event = MaiBoardInteractiveEvent;
  export type ErrorPayload = MaiInteractionErrorPayload;
  export type SlotCreatedPayload = MaiSlotCreatedEventPayload;
  export type BlackoutCreatedPayload = MaiBlackoutCreatedEventPayload;
  export type SlotChangedPayload = MaiSlotChangedEventPayload;
  export type SlotRescheduledPayload = MaiSlotRescheduledEventPayload;
  export type AppointmentChangedPayload = MaiAppointmentChangedEventPayload;
  export type ViewConfig = MaiBoardInteractiveViewConfig;
  export type Mode = MaiBoardMode;
  export type ViewFilterMode = MaiViewFilterMode;
  export type ViewFilter = MaiViewFilter;
  export type ViewFilterOption = MaiViewFilterOption;
  export type CalendarFilterOwnerOption = MaiCalendarFilterOwnerOption;
  export type ActorConfig = MaiBoardInteractiveActorConfig;
  export type ActionConfig = MaiBoardInteractiveActionConfig;
  export type SlotActionPayload = SlotActionEventPayload;
  export type SlotReschedulePayload = SlotRescheduleActionEventPayload;
  export type AppointmentActionPayload = AppointmentActionEventPayload;
  export type CreateSlotPayload = CreateSlotActionEventPayload;
  export type CreateBlackoutPayload = CreateBlackoutActionEventPayload;
}
