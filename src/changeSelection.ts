import type { ChangeEntry, ReviewSession } from "./model";

export interface ChangeSelection {
  readonly repositoryRoot: string;
  readonly baseRef: string;
  readonly comparisonBaseRef: string;
  readonly path: string;
  readonly fileUri: string;
  readonly layer: ChangeEntry["layer"];
  readonly status: ChangeEntry["status"];
  readonly originalPath?: string;
}

export function toChangeSelection(
  session: ReviewSession,
  change: ChangeEntry,
): ChangeSelection {
  return {
    repositoryRoot: session.repository.rootUri.fsPath,
    baseRef: session.baseRef,
    comparisonBaseRef: session.comparisonBaseRef,
    path: change.path,
    fileUri: change.uri.toString(),
    layer: change.layer,
    status: change.status,
    originalPath: change.originalPath,
  };
}
