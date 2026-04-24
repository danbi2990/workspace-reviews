import type { ReviewSession } from "./model";

export function repositoryNodeDescription(changeCount: number): string {
  return changeCount > 0 ? `${changeCount}` : "";
}

export function repositoryNodeTooltip(session: Pick<
  ReviewSession,
  "repository" | "currentBranch" | "baseRef" | "comparisonBaseRef"
>): string {
  return [
    session.repository.rootUri.fsPath,
    `Branch: ${session.currentBranch}`,
    `Base: ${session.baseRef}`,
    `Comparison Base: ${session.comparisonBaseRef}`,
  ].join("\n");
}
