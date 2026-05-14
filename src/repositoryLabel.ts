import * as path from "node:path";

export interface RepositoryLabelWorkspaceFolderLike {
  readonly name: string;
  readonly uri: {
    readonly fsPath: string;
  };
}

export interface RepositoryLabelRepositoryLike {
  readonly rootUri: {
    readonly fsPath: string;
  };
}

export function formatRepositoryLabel(
  workspaceFolder: RepositoryLabelWorkspaceFolderLike,
  repository: RepositoryLabelRepositoryLike,
): string {
  const repositoryName = path.basename(repository.rootUri.fsPath);
  const relativePath = path.relative(
    workspaceFolder.uri.fsPath,
    repository.rootUri.fsPath,
  );

  if (relativePath === "") {
    return "./";
  }

  return repositoryName;
}
