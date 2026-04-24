import * as vscode from "vscode";

export const DEFAULT_BASE_BRANCHES = ["main", "master", "develop"] as const;

export function getDefaultBaseBranches(): string[] {
  return vscode.workspace
    .getConfiguration("workspaceReviews")
    .get<string[]>("defaultBaseBranches", [...DEFAULT_BASE_BRANCHES]);
}
