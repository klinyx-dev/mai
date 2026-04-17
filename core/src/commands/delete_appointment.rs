use serde::{Deserialize, Serialize};

use crate::domain::ids::AppointmentId;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct DeleteAppointmentCommand {
    pub appointment_id: AppointmentId,
}
