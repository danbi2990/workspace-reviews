import * as path from "node:path";
import { ChangeSelection } from "./changeSelection";

export interface ReviewDiffSidePlan {
  readonly kind: "baseContent" | "workingCopy" | "empty";
  readonly path?: string;
  readonly fileUri?: string;
}

export interface ReviewDiffPlan {
  readonly left: ReviewDiffSidePlan;
  readonly right: ReviewDiffSidePlan;
  readonly title: string;
  readonly preserveFocus: false;
}

export function createReviewDiffPlan(
  changeSelection: ChangeSelection,
  fileExists: boolean,
): ReviewDiffPlan {
  return {
    left:
      changeSelection.status === "added" || changeSelection.status === "untracked"
        ? {
            kind: "empty",
          }
        : {
            kind: "baseContent",
            path: changeSelection.originalPath ?? changeSelection.path,
          },
    right:
      changeSelection.status === "deleted" || !fileExists
        ? {
            kind: "empty",
          }
        : {
            kind: "workingCopy",
            fileUri: changeSelection.fileUri,
          },
    title: `${path.basename(changeSelection.path)} (${changeSelection.baseRef} ↔ working tree)`,
    preserveFocus: false,
  };
}
