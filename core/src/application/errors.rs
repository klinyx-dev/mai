use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Clone, Debug, PartialEq, Eq, Error, Serialize, Deserialize)]
pub enum StructuralError {
    #[error("invalid time range")]
    InvalidTimeRange,
    #[error("title cannot be empty")]
    EmptyTitle,
    #[error("invalid visible window")]
    InvalidVisibleWindow,
}

#[derive(Clone, Debug, PartialEq, Eq, Error, Serialize, Deserialize)]
pub enum ReferentialError {
    #[error("slot not found")]
    SlotNotFound,
    #[error("appointment not found")]
    AppointmentNotFound,
    #[error("assignee not found")]
    AssigneeNotFound,
    #[error("creator not found")]
    CreatorNotFound,
}

#[derive(Clone, Debug, PartialEq, Eq, Error, Serialize, Deserialize)]
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

#[derive(Clone, Debug, PartialEq, Eq, Error, Serialize, Deserialize)]
#[serde(tag = "kind", content = "detail")]
pub enum SchedulerError {
    #[error(transparent)]
    Structural(#[from] StructuralError),
    #[error(transparent)]
    Referential(#[from] ReferentialError),
    #[error(transparent)]
    Business(#[from] BusinessRuleError),
}
