use serde::{Deserialize, Serialize};
use thiserror::Error;

// Errors that occur before the business logic is executed
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
    #[error("resource owner not found")]
    ResourceOwnerNotFound,
    #[error("creator not found")]
    CreatorNotFound,
    #[error("invitee not found")]
    InviteeNotFound,
    #[error("updater not found")]
    UpdaterNotFound,
    #[error("canceller not found")]
    CancellerNotFound,
}

// Errors that occur during the business logic execution
#[derive(Clone, Debug, PartialEq, Eq, Error, Serialize, Deserialize)]
pub enum BusinessRuleError {
    #[error("slot id already exists")]
    SlotIdAlreadyExists,
    #[error("appointment id already exists")]
    AppointmentIdAlreadyExists,
    #[error("slot overlaps with an existing active slot for the same resource owner")]
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
    #[error("appointment cancellation is not allowed for this actor")]
    AppointmentCancelNotAllowed,
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
