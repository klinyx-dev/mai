import type { MaiBookingResource } from "../../../types/booking";

export function eligibleResourcesForCategory(
  resources: readonly MaiBookingResource[],
  categoryId: string | null
): MaiBookingResource[] {
  if (!categoryId) {
    return [];
  }

  return resources.filter((resource) => resource.categoryIds.includes(categoryId));
}
