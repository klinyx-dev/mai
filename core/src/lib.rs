pub mod adapters;
pub mod application;
pub mod commands;
pub mod domain;
pub mod layout;
mod state;
mod validation;

pub use application::{
    ActorLookup, BusinessRuleError, CommandResult, ReferentialError, SchedulerError,
    SchedulerService, StructuralError,
};
pub use commands::{
    AddAppointmentCommand, AddBlackoutWindowCommand, AddRecurringTemplateCommand, AddSlotCommand,
    AddSlotsBatchCommand, ApplyRecurringTemplatesCommand, BatchMode, CancelAppointmentCommand,
    CancelSlotCommand, DeleteAppointmentCommand, DeleteSlotCommand, RescheduleSlotCommand,
};
pub use domain::{
    ActorId, ActorRef, Appointment, AppointmentId, BlackoutWindow, RecurringTemplate, Slot, SlotId,
    SlotStatus, TimeRange, TimeRangeError, WeekRange, WeekRangeError,
};
pub use layout::{
    AppointmentLayoutNode, BlackoutLayoutNode, CalendarOwnerFilter, SlotLayoutNode, WeeklyLayout,
    WeeklyLayoutQuery,
};
pub use state::ScheduleState;
