export type MaiBookingStep =
  | "select-specialty"
  | "select-slot"
  | "auth-required"
  | "submitting"
  | "refreshing"
  | "confirmed"
  | "error";

export interface MaiBookingSpecialty {
  specialtyId: string;
  label: string;
  reasonLabel?: string;
}

export interface MaiBookingDoctor {
  doctorId: string;
  displayName: string;
  specialtyIds: string[];
  resourceOwnerId: string;
}

export interface MaiBookingSlotSelection {
  slotId: string;
  dayIndex: number;
  startMinute: number;
  endMinute: number;
  resourceOwnerId?: string;
}

export interface MaiBookingAvailabilitySlot extends MaiBookingSlotSelection {
  doctorId?: string;
  doctorDisplayName?: string;
}

export interface MaiBookingSlotOwner {
  resourceOwnerId: string;
  doctorId?: string;
  doctorDisplayName?: string;
}

export interface MaiBookingAuthIdentity {
  inviteeId: string;
  userDisplayName: string;
  createdBy?: string;
}

export interface MaiBookingError {
  action: string;
  message: string;
}

export interface MaiBookingFlowState {
  step: MaiBookingStep;
  selectedSpecialtyId: string | null;
  selectedDoctorId: string | null;
  selectedSlot: MaiBookingSlotSelection | null;
  auth: MaiBookingAuthIdentity | null;
  error: MaiBookingError | null;
}
