use crate::{BusinessRuleError, ReferentialError, SchedulerError, StructuralError};

use super::{WasmAdapterError, WasmErrorCategory};

impl WasmAdapterError {
    pub fn from_scheduler_error(error: SchedulerError) -> Self {
        match error {
            SchedulerError::Structural(err) => Self {
                category: WasmErrorCategory::Structural,
                code: structural_error_code(&err).to_string(),
                message: err.to_string(),
            },
            SchedulerError::Referential(err) => Self {
                category: WasmErrorCategory::Referential,
                code: referential_error_code(&err).to_string(),
                message: err.to_string(),
            },
            SchedulerError::Business(err) => Self {
                category: WasmErrorCategory::Business,
                code: business_error_code(&err).to_string(),
                message: err.to_string(),
            },
        }
    }

    pub fn invalid_json(message: String) -> Self {
        Self {
            category: WasmErrorCategory::Contract,
            code: "invalid_json".to_string(),
            message,
        }
    }

    pub fn invalid_timezone() -> Self {
        Self {
            category: WasmErrorCategory::Contract,
            code: "invalid_timezone".to_string(),
            message: "invalid timezone value".to_string(),
        }
    }
}

fn structural_error_code(error: &StructuralError) -> &'static str {
    match error {
        StructuralError::InvalidTimeRange => "invalid_time_range",
        StructuralError::EmptyTitle => "empty_title",
        StructuralError::InvalidVisibleWindow => "invalid_visible_window",
    }
}

fn referential_error_code(error: &ReferentialError) -> &'static str {
    match error {
        ReferentialError::SlotNotFound => "slot_not_found",
        ReferentialError::AppointmentNotFound => "appointment_not_found",
        ReferentialError::ResourceOwnerNotFound => "resource_owner_not_found",
        ReferentialError::CreatorNotFound => "creator_not_found",
    }
}

fn business_error_code(error: &BusinessRuleError) -> &'static str {
    match error {
        BusinessRuleError::SlotOverlap => "slot_overlap",
        BusinessRuleError::SlotAlreadyBooked => "slot_already_booked",
        BusinessRuleError::SlotCancelled => "slot_cancelled",
        BusinessRuleError::SlotNotAvailable => "slot_not_available",
        BusinessRuleError::CannotDeleteBookedSlot => "cannot_delete_booked_slot",
        BusinessRuleError::AppointmentAlreadyExistsForSlot => "appointment_already_exists_for_slot",
        BusinessRuleError::AppointmentCancelNotAllowed => "appointment_cancel_not_allowed",
    }
}
