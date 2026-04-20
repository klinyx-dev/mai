pub mod actor;
pub mod appointment;
pub mod enums;
pub mod ids;
pub mod slot;
pub mod time_range;
pub mod week;

pub use actor::ActorRef;
pub use appointment::Appointment;
pub use enums::SlotStatus;
pub use ids::{ActorId, AppointmentId, SlotId};
pub use slot::Slot;
pub use time_range::{TimeRange, TimeRangeError};
pub use week::{WeekRange, WeekRangeError};
