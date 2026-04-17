
use thiserror::Error;

#[derive(Clone, Debug, PartialEq, Eq, Error)]
pub enum StructuralError {
    #[error("invalid time range")]
    InvalidTimeRange,
    #[error("title cannot be empty")]
    EmptyTitle,
}

#[derive(Clone, Debug, PartialEq, Eq, Error)]
pub enum ReferentialError {
    #[error("slot not found")]
    SlotNotFound,
    #[error("appointment not found")]
    AppointmentNotFound,
}

#[derive(Clone, Debug, PartialEq, Eq, Error)]
pub enum BusinessRuleError {
    #[error("slot overlaps with an existing active slot for the same assignee")]
    SlotOverlap,
    #[error("slot is already booked")]
    SlotAlreadyBooked,
    #[error("slot is cancelled")]
    SlotCancelled,
    #[error("slot is not available")]
    SlotNotAvailable,
    #[error("cannot delete a booked slot")]
    CannotDeleteBookedSlot,
    #[error("appointment already exists for this slot")]
    AppointmentAlreadyExistsForSlot,
}

#[derive(Clone, Debug, PartialEq, Eq, Error)]
pub enum SchedulerError {
    #[error(transparent)]
    Structural(#[from] StructuralError),
    #[error(transparent)]
    Referential(#[from] ReferentialError),
    #[error(transparent)]
    Business(#[from] BusinessRuleError),
}
