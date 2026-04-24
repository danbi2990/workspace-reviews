import * as path from "node:path";
import * as vscode from "vscode";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveComparisonBaseRef } from "./comparisonBase";
import { ChangeEntry, ChangeLayer, ChangeStatus } from "./model";
import { parseRawNameStatusOutput } from "./nameStatus";
import { Change, Repository } from "./types";

const execFileAsync = promisify(execFile);

export async function getCommittedChanges(
  repository: Repository,
  comparisonBaseRef: string,
): Promise<ChangeEntry[]> {
  const headRef = repository.state.HEAD?.commit ?? "HEAD";

  try {
    const { stdout } = await runGit(repository.rootUri.fsPath, [
      "diff",
      "--name-status",
      "--find-renames",
      comparisonBaseRef,
      headRef,
    ]);

    return parseNameStatusOutput(
      stdout,
      repository.rootUri,
      "committed",
    );
  } catch {
    return [];
  }
}

export async function getComparisonBaseRef(
  repository: Repository,
  baseRef: string,
): Promise<string> {
  const headRef = repository.state.HEAD?.commit ?? "HEAD";

  try {
    const { stdout } = await runGit(repository.rootUri.fsPath, [
      "merge-base",
      baseRef,
      headRef,
    ]);
    return resolveComparisonBaseRef(baseRef, stdout);
  } catch {
    return baseRef;
  }
}

export function collectWorkingTreeChanges(
  repositoryRoot: vscode.Uri,
  changes: readonly Change[],
  layer: Exclude<ChangeLayer, "committed">,
): ChangeEntry[] {
  return changes.map((change) => {
    const status = mapGitApiStatus(change.status, layer);
    const uri = change.uri;
    const originalUri = change.originalUri;

    return {
      path: path.relative(repositoryRoot.fsPath, uri.fsPath),
      uri,
      status,
      layer,
      originalPath: originalUri
        ? path.relative(repositoryRoot.fsPath, originalUri.fsPath)
        : undefined,
      originalUri,
    };
  });
}

export async function getBaseFileContent(
  repositoryRoot: string,
  ref: string,
  relativePath: string,
): Promise<string> {
  try {
    const gitPath = toGitRelativePath(relativePath);
    const { stdout } = await runGit(repositoryRoot, [
      "show",
      `${ref}:${gitPath}`,
    ]);
    return stdout;
  } catch {
    return "";
  }
}

export function parseNameStatusOutput(
  output: string,
  repositoryRoot: vscode.Uri,
  layer: ChangeLayer,
): ChangeEntry[] {
  return parseRawNameStatusOutput(output, layer).map((entry) => ({
    path: entry.path,
    uri: vscode.Uri.joinPath(repositoryRoot, entry.path),
    status: entry.status,
    layer: entry.layer,
    originalPath: entry.originalPath,
    originalUri: entry.originalPath
      ? vscode.Uri.joinPath(repositoryRoot, entry.originalPath)
      : undefined,
  }));
}

function mapGitApiStatus(
  status: number | undefined,
  layer: Exclude<ChangeLayer, "committed">,
): ChangeStatus {
  if (layer === "untracked") {
    return "untracked";
  }

  switch (status) {
    case 1:
      return "added";
    case 2:
    case 6:
      return "deleted";
    case 3:
    case 10:
      return "renamed";
    case 7:
      return "untracked";
    default:
      return "modified";
  }
}

async function runGit(cwd: string, args: readonly string[]) {
  return execFileAsync("git", [...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function toGitRelativePath(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}
