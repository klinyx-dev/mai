pub mod adapters;
pub mod application;
pub mod commands;
pub mod domain;
pub mod layout;
pub mod state;
pub mod validation;

pub use application::{
    BusinessRuleError, CommandResult, ReferentialError, SchedulerError, SchedulerService,
    StructuralError,
};
pub use commands::{
    AddAppointmentCommand, AddSlotCommand, CancelSlotCommand, DeleteAppointmentCommand,
    DeleteSlotCommand,
};
pub use domain::{
    ActorId, ActorRef, Appointment, AppointmentId, Slot, SlotId, SlotStatus, TimeRange,
    TimeRangeError, WeekRange, WeekRangeError,
};
pub use layout::{AppointmentLayoutNode, SlotLayoutNode, WeeklyLayout, WeeklyLayoutQuery};
pub use state::ScheduleState;
