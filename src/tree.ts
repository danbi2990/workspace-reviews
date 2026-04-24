import * as path from "node:path";
import * as vscode from "vscode";
import { ChangeSelection, toChangeSelection } from "./changeSelection";
import {
  ChangeTreeDirectory,
  ChangeTreeNode,
  buildChangeTree,
} from "./changeTree";
import { getDefaultBaseBranches } from "./config";
import { emptyDocumentUri, toBaseContentUri } from "./contentProvider";
import { createReviewDiffPlan } from "./diffView";
import {
  aggregateDecorationStatus,
  encodeDecorationMetadata,
} from "./fileDecorationData";
import { collectReviewSessions, getGitApi } from "./git";
import { ChangeEntry, ReviewSession } from "./model";
import {
  repositoryNodeDescription,
  repositoryNodeTooltip,
} from "./repositoryNodePresentation";
import { resolveTreeItemAbsolutePath } from "./treePath";
import { getVisibleChanges } from "./visibleChanges";

const BASE_OVERRIDE_KEY = "workspaceReviews.baseOverrides";

export class WorkspaceReviewsProvider
  implements vscode.TreeDataProvider<TreeNode>, vscode.Disposable
{
  private readonly onDidChangeTreeDataEmitter =
    new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private readonly disposables: vscode.Disposable[] = [];
  private gitRefreshSubscriptions: vscode.Disposable[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {}

  async initialize(): Promise<void> {
    const gitApi = await getGitApi();
    if (gitApi) {
      this.disposables.push(
        gitApi.onDidOpenRepository(() => void this.refresh()),
        gitApi.onDidCloseRepository(() => void this.refresh()),
      );
      this.bindRepositoryStateListeners(gitApi);
    }

    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => void this.refresh()),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("workspaceReviews.defaultBaseBranches")) {
          void this.refresh();
        }
      }),
    );

    await this.refresh();
  }

  dispose(): void {
    vscode.Disposable.from(...this.gitRefreshSubscriptions).dispose();
    vscode.Disposable.from(...this.disposables).dispose();
    this.onDidChangeTreeDataEmitter.dispose();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getParent(element: TreeNode): TreeNode | undefined {
    return element.parent;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (element instanceof RepositoryNode) {
      return this.getRepositoryChildren(element);
    }

    if (element instanceof DirectoryNode) {
      return [...element.children];
    }

    const sessions = await this.getSessions();
    if (sessions.length === 0) {
      return [
        new InfoNode(
          "No Git repositories in the current workspace",
          "Add a Git-backed workspace folder to start a review session.",
        ),
      ];
    }

    return this.toRepositoryNodes(sessions);
  }

  async refresh(): Promise<void> {
    await this.getSessions();
    this.onDidChangeTreeDataEmitter.fire();
  }

  async getRepositoryItems(): Promise<WorkspaceReviewsRepositoryTreeNode[]> {
    return this.toRepositoryNodes(await this.getSessions());
  }

  getSessionForTreeItem(item?: unknown): ReviewSession | undefined {
    const repositoryNode = this.getRepositoryTreeItem(item);
    if (repositoryNode) {
      return repositoryNode.session;
    }

    return undefined;
  }

  getAbsolutePathForTreeItem(item?: unknown): string | undefined {
    return resolveTreeItemAbsolutePath(item);
  }

  getRepositoryTreeItem(item?: unknown): WorkspaceReviewsRepositoryTreeNode | undefined {
    let current = item;

    while (current) {
      if (current instanceof RepositoryNode) {
        return current;
      }

      if (current instanceof DirectoryNode || current instanceof ChangeLeafNode) {
        current = current.parent;
        continue;
      }

      return undefined;
    }

    return undefined;
  }

  async openChange(changeSelection: ChangeSelection): Promise<void> {
    const rightFileUri = vscode.Uri.parse(changeSelection.fileUri);
    const fileExists = await uriExists(rightFileUri);
    const diffPlan = createReviewDiffPlan(changeSelection, fileExists);
    const leftUri =
      diffPlan.left.kind === "empty"
        ? emptyDocumentUri()
        : toBaseContentUri({
            repositoryRoot: changeSelection.repositoryRoot,
            ref: changeSelection.comparisonBaseRef,
            path: diffPlan.left.path ?? changeSelection.path,
          });
    const rightUri =
      diffPlan.right.kind === "empty"
        ? emptyDocumentUri()
        : vscode.Uri.parse(diffPlan.right.fileUri ?? changeSelection.fileUri);

    await vscode.commands.executeCommand(
      "vscode.diff",
      leftUri,
      rightUri,
      diffPlan.title,
      {
        preserveFocus: diffPlan.preserveFocus,
      },
    );
  }

  async setBaseOverride(repositoryPath: string, baseRef: string): Promise<void> {
    const overrides = this.readBaseOverrides();
    overrides[repositoryPath] = baseRef;
    await this.context.workspaceState.update(BASE_OVERRIDE_KEY, overrides);
    await this.refresh();
  }

  async clearBaseOverride(repositoryPath: string): Promise<void> {
    const overrides = this.readBaseOverrides();
    delete overrides[repositoryPath];
    await this.context.workspaceState.update(BASE_OVERRIDE_KEY, overrides);
    await this.refresh();
  }

  private async getSessions(): Promise<ReviewSession[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    if (workspaceFolders.length === 0) {
      return [];
    }

    const gitApi = await getGitApi();
    if (!gitApi) {
      return [];
    }

    this.bindRepositoryStateListeners(gitApi);

    const overrides = new Map(Object.entries(this.readBaseOverrides()));
    const sessions = await collectReviewSessions({
      gitApi,
      workspaceFolders,
      defaultBaseBranches: getDefaultBaseBranches(),
      baseOverrides: overrides,
    });

    return sessions;
  }

  private toRepositoryNodes(
    sessions: readonly ReviewSession[],
  ): WorkspaceReviewsRepositoryTreeNode[] {
    return sessions.map((session) => {
      const visibleChanges = getVisibleChanges(session);
      return new RepositoryNode(session, visibleChanges);
    });
  }

  private getRepositoryChildren(repositoryNode: RepositoryNode): TreeNode[] {
    const visibleChanges = getVisibleChanges(repositoryNode.session);
    return [
      ...(visibleChanges.length > 0
        ? buildChangeTree(visibleChanges).map((node) =>
            toTreeNode(repositoryNode.session, node, repositoryNode),
          )
        : [new InfoNode("No changed files")]),
    ];
  }

  private bindRepositoryStateListeners(gitApi: import("./types").GitApi): void {
    vscode.Disposable.from(...this.gitRefreshSubscriptions).dispose();
    this.gitRefreshSubscriptions = gitApi.repositories
      .map((repository) => repository.state.onDidChange?.(() => void this.refresh()))
      .filter((value): value is vscode.Disposable => Boolean(value));
  }

  private readBaseOverrides(): Record<string, string> {
    return (
      this.context.workspaceState.get<Record<string, string>>(BASE_OVERRIDE_KEY) ??
      {}
    );
  }
}

export type WorkspaceReviewsTreeNode =
  | RepositoryNode
  | DirectoryNode
  | ChangeLeafNode
  | InfoNode;
export type WorkspaceReviewsRepositoryTreeNode = RepositoryNode;
type TreeNode = WorkspaceReviewsTreeNode;

class RepositoryNode extends vscode.TreeItem {
  readonly absolutePath: string;
  readonly contextValue = "repositorySession";
  readonly parent = undefined;

  constructor(
    readonly session: ReviewSession,
    visibleChanges: readonly ChangeEntry[],
  ) {
    super(session.repositoryLabel, vscode.TreeItemCollapsibleState.Collapsed);
    this.absolutePath = session.repository.rootUri.fsPath;
    this.id = `repository:${session.repository.rootUri.fsPath}`;
    this.description = repositoryNodeDescription(visibleChanges.length);
    this.tooltip = repositoryNodeTooltip(session);
    this.iconPath = new vscode.ThemeIcon("repo");
    const aggregatedStatus = aggregateDecorationStatus(
      visibleChanges.map((change) => change.status),
    );
    if (aggregatedStatus) {
      this.resourceUri = session.repository.rootUri.with({
        query: encodeDecorationMetadata({
          kind: "container",
          status: aggregatedStatus,
        }),
      });
    }
  }
}

class DirectoryNode extends vscode.TreeItem {
  readonly absolutePath: string;
  readonly contextValue = "directory";
  children: readonly TreeNode[];

  constructor(
    readonly parent: TreeNode,
    session: ReviewSession,
    directory: ChangeTreeDirectory,
    children: readonly TreeNode[],
  ) {
    super(directory.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.absolutePath = vscode.Uri.joinPath(
      session.repository.rootUri,
      directory.relativePath,
    ).fsPath;
    this.id = `directory:${session.repository.rootUri.fsPath}:${directory.relativePath}`;
    this.children = children;
    this.tooltip = directory.relativePath;
    this.iconPath = vscode.ThemeIcon.Folder;
    const aggregatedStatus = aggregateDecorationStatus(
      collectNodeStatuses(directory),
    );
    if (aggregatedStatus) {
      this.resourceUri = vscode.Uri.joinPath(
        session.repository.rootUri,
        directory.relativePath,
      ).with({
        query: encodeDecorationMetadata({
          kind: "container",
          status: aggregatedStatus,
        }),
      });
    }
  }
}

class ChangeLeafNode extends vscode.TreeItem {
  readonly absolutePath: string;
  readonly contextValue = "file";

  constructor(
    readonly parent: TreeNode,
    session: ReviewSession,
    change: ChangeEntry,
  ) {
    super(
      path.basename(change.uri.fsPath),
      vscode.TreeItemCollapsibleState.None,
    );
    this.absolutePath = change.uri.fsPath;
    this.id = `file:${session.repository.rootUri.fsPath}:${change.path}`;
    this.description = "";
    this.tooltip = change.uri.fsPath;
    this.resourceUri = change.uri.with({
      query: encodeDecorationMetadata({
        kind: "file",
        status: change.status,
        originalPath: change.originalPath,
      }),
    });
    this.command = {
      command: "workspace-reviews.openChange",
      title: "Open Review Diff",
      arguments: [
        toChangeSelection(session, change),
      ],
    };
    this.iconPath = vscode.ThemeIcon.File;
  }
}

class InfoNode extends vscode.TreeItem {
  readonly parent = undefined;

  constructor(label: string, description?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.contextValue = "info";
  }
}

function toTreeNode(
  session: ReviewSession,
  node: ChangeTreeNode,
  parent: TreeNode,
): TreeNode {
  if (node.kind === "directory") {
    const directoryNode = new DirectoryNode(parent, session, node, []);
    directoryNode.children = node.children.map((child) =>
      toTreeNode(session, child, directoryNode),
    );
    return directoryNode;
  }

  return new ChangeLeafNode(parent, session, node.change);
}

function collectNodeStatuses(node: ChangeTreeNode): ChangeEntry["status"][] {
  if (node.kind === "file") {
    return [node.change.status];
  }

  return node.children.flatMap((child) => collectNodeStatuses(child));
}

async function uriExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}
