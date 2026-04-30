use serde::{Deserialize, Serialize};

use crate::ActorId;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum CalendarOwnerFilter {
    #[default]
    All,
    None,
    Owners(Vec<ActorId>),
}

impl CalendarOwnerFilter {
    pub fn from_owner_ids(owner_ids: Vec<ActorId>) -> Self {
        let mut unique = Vec::new();
        for owner_id in owner_ids {
            if !unique.contains(&owner_id) {
                unique.push(owner_id);
            }
        }

        if unique.is_empty() {
            Self::None
        } else {
            Self::Owners(unique)
        }
    }

    pub fn matches_owner(&self, owner_id: &ActorId) -> bool {
        match self {
            Self::All => true,
            Self::None => false,
            Self::Owners(owner_ids) => owner_ids.contains(owner_id),
        }
    }

    pub fn is_all(&self) -> bool {
        matches!(self, Self::All)
    }
}
