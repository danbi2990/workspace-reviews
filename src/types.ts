import * as vscode from "vscode";

export interface GitExtensionExports {
  getAPI(version: 1): GitApi;
}

export interface GitApi {
  readonly repositories: Repository[];
  readonly onDidOpenRepository: vscode.Event<Repository>;
  readonly onDidCloseRepository: vscode.Event<Repository>;
}

export interface Repository {
  readonly rootUri: vscode.Uri;
  readonly state: RepositoryState;
  status(): Promise<void>;
}

export interface RepositoryState {
  readonly HEAD?: Branch;
  readonly remotes?: readonly Remote[];
  readonly mergeChanges: readonly Change[];
  readonly indexChanges: readonly Change[];
  readonly workingTreeChanges: readonly Change[];
  readonly untrackedChanges: readonly Change[];
  readonly onDidChange?: vscode.Event<void>;
}

export interface Remote {
  readonly name: string;
  readonly fetchUrl?: string;
}

export interface Branch {
  readonly name?: string;
  readonly commit?: string;
  readonly upstream?: UpstreamRef;
}

export interface UpstreamRef {
  readonly name?: string;
  readonly remote?: string;
}

export interface Change {
  readonly uri: vscode.Uri;
  readonly originalUri?: vscode.Uri;
  readonly renameUri?: vscode.Uri;
  readonly status?: number;
}
