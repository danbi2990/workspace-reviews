import * as path from "node:path";
import * as vscode from "vscode";
import { ReviewSession } from "./model";
import { createReviewSession } from "./session";
import { GitApi, GitExtensionExports, Repository } from "./types";

export async function getGitApi(): Promise<GitApi | undefined> {
  const extension =
    vscode.extensions.getExtension<GitExtensionExports>("vscode.git");
  if (!extension) {
    return undefined;
  }

  if (!extension.isActive) {
    await extension.activate();
  }

  return extension.exports.getAPI(1);
}

export function collectReviewSessions(params: {
  gitApi: GitApi;
  workspaceFolders: readonly vscode.WorkspaceFolder[];
  defaultBaseBranches: readonly string[];
  baseOverrides: ReadonlyMap<string, string>;
}): Promise<ReviewSession[]> {
  const { gitApi, workspaceFolders, defaultBaseBranches, baseOverrides } =
    params;

  const sessions: Promise<ReviewSession>[] = [];
  for (const repository of gitApi.repositories) {
    const workspaceFolder = findOwningWorkspaceFolder(
      repository,
      workspaceFolders,
    );
    if (!workspaceFolder) {
      continue;
    }

    sessions.push(
      createReviewSession({
        workspaceFolder,
        repository,
        defaultBaseBranches,
        explicitBaseRef: baseOverrides.get(repository.rootUri.fsPath),
      }),
    );
  }

  return Promise.all(sessions).then(sortReviewSessions);
}

function sortReviewSessions(sessions: ReviewSession[]): ReviewSession[] {
  return sessions.sort((left, right) => {
    const leftFolder = left.workspaceFolder.index;
    const rightFolder = right.workspaceFolder.index;
    if (leftFolder !== rightFolder) {
      return leftFolder - rightFolder;
    }

    return left.repository.rootUri.fsPath.localeCompare(
      right.repository.rootUri.fsPath,
    );
  });
}

function findOwningWorkspaceFolder(
  repository: Repository,
  workspaceFolders: readonly vscode.WorkspaceFolder[],
): vscode.WorkspaceFolder | undefined {
  const repositoryPath = repository.rootUri.fsPath;
  let bestMatch: vscode.WorkspaceFolder | undefined;

  for (const folder of workspaceFolders) {
    const folderPath = folder.uri.fsPath;
    const relativePath = path.relative(folderPath, repositoryPath);
    const isInside =
      relativePath === "" ||
      (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));

    if (!isInside) {
      continue;
    }

    if (
      !bestMatch ||
      folder.uri.fsPath.length > bestMatch.uri.fsPath.length
    ) {
      bestMatch = folder;
    }
  }

  return bestMatch;
}
