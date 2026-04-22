use serde::{Deserialize, Serialize};

use crate::domain::ids::AppointmentId;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct CancelAppointmentCommand {
    pub appointment_id: AppointmentId,
}
