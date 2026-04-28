import type { MaiBookingDoctor } from "../types/booking";

export function eligibleDoctorsForSpecialty(
  doctors: readonly MaiBookingDoctor[],
  specialtyId: string | null
): MaiBookingDoctor[] {
  if (!specialtyId) {
    return [];
  }

  return doctors.filter((doctor) => doctor.specialtyIds.includes(specialtyId));
}
