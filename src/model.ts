import * as vscode from "vscode";
import { Repository } from "./types";

export type ChangeLayer = "committed" | "staged" | "unstaged" | "untracked";

export type ChangeStatus =
  | "added"
  | "modified"
  | "deleted"
  | "renamed"
  | "untracked";

export interface ChangeEntry {
  readonly path: string;
  readonly uri: vscode.Uri;
  readonly status: ChangeStatus;
  readonly layer: ChangeLayer;
  readonly originalPath?: string;
  readonly originalUri?: vscode.Uri;
}

export interface ReviewSession {
  readonly id: string;
  readonly workspaceFolder: vscode.WorkspaceFolder;
  readonly repository: Repository;
  readonly repositoryLabel: string;
  readonly currentBranch: string;
  readonly baseRef: string;
  readonly comparisonBaseRef: string;
  readonly committedChanges: readonly ChangeEntry[];
  readonly stagedChanges: readonly ChangeEntry[];
  readonly unstagedChanges: readonly ChangeEntry[];
  readonly untrackedChanges: readonly ChangeEntry[];
}
