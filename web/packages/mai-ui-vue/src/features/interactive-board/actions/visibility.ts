import type { MaiActionVisibility, MaiInteractionAction } from "../../../types";

export function isMaiActionVisible(
  visibility: MaiActionVisibility | undefined,
  action: MaiInteractionAction
): boolean {
  return visibility?.[action] !== false;
}
