import type { MaiActionVisibility, MaiInteractionAction } from "../../../types";
import type { ActionButtonModel } from "../../../shared/ui/action-card/MaiActionCard";

export function isMaiActionVisible(
  visibility: MaiActionVisibility | undefined,
  action: MaiInteractionAction
): boolean {
  return visibility?.[action] !== false;
}

export function visibleActionButtons(
  buttons: ActionButtonModel[],
  visibility: MaiActionVisibility | undefined
): ActionButtonModel[] {
  return buttons.filter((button) =>
    isMaiActionVisible(visibility, button.key as MaiInteractionAction)
  );
}
