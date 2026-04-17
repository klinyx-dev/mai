use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SlotId(String);

#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AppointmentId(String);

#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ActorId(String);

impl SlotId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl AppointmentId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl ActorId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl From<String> for SlotId {
    fn from(value: String) -> Self {
        Self::new(value)
    }
}

impl From<&str> for SlotId {
    fn from(value: &str) -> Self {
        Self::new(value)
    }
}

impl From<String> for AppointmentId {
    fn from(value: String) -> Self {
        Self::new(value)
    }
}

impl From<&str> for AppointmentId {
    fn from(value: &str) -> Self {
        Self::new(value)
    }
}

impl From<String> for ActorId {
    fn from(value: String) -> Self {
        Self::new(value)
    }
}

impl From<&str> for ActorId {
    fn from(value: &str) -> Self {
        Self::new(value)
    }
}

impl fmt::Display for SlotId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl fmt::Display for AppointmentId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl fmt::Display for ActorId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::{ActorId, AppointmentId, SlotId};

    #[test]
    fn typed_ids_preserve_original_values() {
        let slot_id = SlotId::new("slot-1");
        let appointment_id = AppointmentId::new("appt-1");
        let actor_id = ActorId::new("actor-1");

        assert_eq!(slot_id.as_str(), "slot-1");
        assert_eq!(appointment_id.as_str(), "appt-1");
        assert_eq!(actor_id.as_str(), "actor-1");
    }

    #[test]
    fn typed_ids_do_not_compare_equal_across_types() {
        let slot_id = SlotId::new("same-value");
        let appointment_id = AppointmentId::new("same-value");
        let actor_id = ActorId::new("same-value");

        assert_eq!(slot_id.to_string(), "same-value");
        assert_eq!(appointment_id.to_string(), "same-value");
        assert_eq!(actor_id.to_string(), "same-value");
    }
}
