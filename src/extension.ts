import * as vscode from "vscode";
import {
  buildBaseRefCandidates,
  createBaseDetectionOptions,
} from "./baseDetection";
import { ChangeSelection } from "./changeSelection";
import { getDefaultBaseBranches } from "./config";
import {
  BASE_CONTENT_SCHEME,
  BaseContentProvider,
} from "./contentProvider";
import { WorkspaceReviewDecorationProvider } from "./fileDecorationProvider";
import {
  formatAbsolutePathsForTerminal,
  resolveAbsolutePathsForSend,
} from "./sendPathToTerminal";
import {
  WorkspaceReviewsProvider,
  WorkspaceReviewsTreeNode,
  WorkspaceReviewsRepositoryTreeNode,
} from "./tree";

const OPEN_REPOSITORY_TREE_COMMAND = "workspace-reviews.openRepositoryTree";
const COLLAPSE_ALL_COMMAND = "workspace-reviews.collapseAll";
const SEND_PATH_TO_TERMINAL_COMMAND = "workspace-reviews.sendPathToTerminal";
const COLLAPSE_ALL_TREE_VIEW_COMMAND =
  "workbench.actions.treeView.workspaceReviews.sessions.collapseAll";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const provider = new WorkspaceReviewsProvider(context);
  const baseContentProvider = new BaseContentProvider();
  const decorationProvider = new WorkspaceReviewDecorationProvider();
  context.subscriptions.push(provider);
  context.subscriptions.push(baseContentProvider);
  context.subscriptions.push(decorationProvider);

  const treeView = vscode.window.createTreeView("workspaceReviews.sessions", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider),
    vscode.workspace.registerTextDocumentContentProvider(
      BASE_CONTENT_SCHEME,
      baseContentProvider,
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workspace-reviews.refresh", async () => {
      await provider.refresh();
    }),
    vscode.commands.registerCommand(COLLAPSE_ALL_COMMAND, async () => {
      await vscode.commands.executeCommand(COLLAPSE_ALL_TREE_VIEW_COMMAND);
    }),
    vscode.commands.registerCommand(
      SEND_PATH_TO_TERMINAL_COMMAND,
      async (item?: unknown) => {
        const absolutePaths = resolveAbsolutePathsForSend(
          item,
          treeView.selection,
          (value) => provider.getAbsolutePathForTreeItem(value),
        );
        const terminalText = formatAbsolutePathsForTerminal(absolutePaths);
        if (!terminalText) {
          void vscode.window.showWarningMessage(
            "Select a Workspace Reviews repository, folder, or file first.",
          );
          return;
        }

        const terminal =
          vscode.window.activeTerminal ??
          vscode.window.createTerminal("Workspace Reviews");
        terminal.sendText(terminalText, false);
        terminal.show();
      },
    ),
    vscode.commands.registerCommand(
      OPEN_REPOSITORY_TREE_COMMAND,
      async () => {
        await openRepositoryTree(provider, treeView);
      },
    ),
    vscode.commands.registerCommand(
      "workspace-reviews.openChange",
      async (selection?: unknown) => {
        if (!selection || typeof selection !== "object") {
          return;
        }

        await provider.openChange(selection as ChangeSelection);
      },
    ),
    vscode.commands.registerCommand(
      "workspace-reviews.pickBaseBranch",
      async (item?: unknown) => {
        const session = provider.getSessionForTreeItem(item);
        if (!session) {
          return;
        }

        const candidates = buildBaseRefCandidates(
          createBaseDetectionOptions(
            session.repository,
            getDefaultBaseBranches(),
            undefined,
          ),
        );

        const quickPick = await vscode.window.showQuickPick(
          [
            ...candidates.map((candidate) => ({
              label: candidate,
            })),
            {
              label: "Custom base ref...",
            },
          ],
          {
            placeHolder: `Choose a base ref for ${session.repositoryLabel}`,
          },
        );

        if (!quickPick) {
          return;
        }

        if (quickPick.label === "Custom base ref...") {
          const customValue = await vscode.window.showInputBox({
            prompt: "Enter a base ref",
            placeHolder: "origin/main",
            value: session.baseRef,
          });

          if (!customValue?.trim()) {
            return;
          }

          await provider.setBaseOverride(
            session.repository.rootUri.fsPath,
            customValue.trim(),
          );
          return;
        }

        await provider.setBaseOverride(
          session.repository.rootUri.fsPath,
          quickPick.label,
        );
      },
    ),
    vscode.commands.registerCommand(
      "workspace-reviews.clearBaseBranchOverride",
      async (item?: unknown) => {
        const session = provider.getSessionForTreeItem(item);
        if (!session) {
          return;
        }

        await provider.clearBaseOverride(session.repository.rootUri.fsPath);
      },
    ),
  );

  await provider.initialize();
}

export function deactivate(): void {}

async function openRepositoryTree(
  provider: WorkspaceReviewsProvider,
  treeView: vscode.TreeView<WorkspaceReviewsTreeNode>,
): Promise<void> {
  const repositoryItem = await pickRepositoryItem(provider);
  if (!repositoryItem) {
    return;
  }

  await treeView.reveal(repositoryItem, {
    select: true,
    focus: true,
    expand: 99,
  });
}

async function pickRepositoryItem(
  provider: WorkspaceReviewsProvider,
): Promise<WorkspaceReviewsRepositoryTreeNode | undefined> {
  const repositoryItems = await provider.getRepositoryItems();
  if (repositoryItems.length === 0) {
    return undefined;
  }

  const picks = repositoryItems.map((item) => ({
    label: treeItemLabel(item.label),
    item,
  }));
  const picked = await vscode.window.showQuickPick(
    picks,
    {
      placeHolder: "Choose a Workspace Reviews repository",
    },
  );

  return picked?.item;
}

function treeItemLabel(label: vscode.TreeItem["label"]): string {
  if (typeof label === "string") {
    return label;
  }

  return label?.label ?? "Repository";
}
