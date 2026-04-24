import * as path from "node:path";
import * as vscode from "vscode";
import {
  createBaseDetectionOptions,
  detectBaseRef,
} from "./baseDetection";
import {
  collectWorkingTreeChanges,
  getComparisonBaseRef,
  getCommittedChanges,
} from "./gitDiff";
import { ChangeEntry, ReviewSession } from "./model";
import { Repository } from "./types";

export async function createReviewSession(params: {
  workspaceFolder: vscode.WorkspaceFolder;
  repository: Repository;
  defaultBaseBranches: readonly string[];
  explicitBaseRef?: string;
}): Promise<ReviewSession> {
  const { workspaceFolder, repository, defaultBaseBranches, explicitBaseRef } =
    params;
  const currentBranch =
    repository.state.HEAD?.name ??
    shortCommit(repository.state.HEAD?.commit) ??
    "detached HEAD";

  const baseRef = detectBaseRef(
    createBaseDetectionOptions(repository, defaultBaseBranches, explicitBaseRef),
  );
  const comparisonBaseRef = await getComparisonBaseRef(repository, baseRef);
  const committedChanges = await getCommittedChanges(
    repository,
    comparisonBaseRef,
  );
  const stagedChanges = collectWorkingTreeChanges(
    repository.rootUri,
    repository.state.indexChanges,
    "staged",
  );
  const unstagedChanges = collectWorkingTreeChanges(
    repository.rootUri,
    repository.state.workingTreeChanges,
    "unstaged",
  );
  const untrackedChanges = collectWorkingTreeChanges(
    repository.rootUri,
    repository.state.untrackedChanges,
    "untracked",
  );

  return {
    id: repository.rootUri.toString(),
    workspaceFolder,
    repository,
    repositoryLabel: path.basename(repository.rootUri.fsPath),
    currentBranch,
    baseRef,
    comparisonBaseRef,
    committedChanges,
    stagedChanges,
    unstagedChanges,
    untrackedChanges,
  };
}

function shortCommit(commit?: string): string | undefined {
  return commit?.slice(0, 7);
}
