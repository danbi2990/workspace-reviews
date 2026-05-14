export interface WorkspaceRepositoryLike {
  readonly workspaceFolder: {
    readonly uri: {
      readonly fsPath: string;
    };
  };
  readonly repository: {
    readonly rootUri: {
      readonly fsPath: string;
    };
  };
}

export interface WorkspaceRepositoryGroup<TSession extends WorkspaceRepositoryLike> {
  readonly sessions: readonly TSession[];
  readonly directRepositorySession: TSession | undefined;
}

export function groupSessionsByWorkspaceFolder<
  TSession extends WorkspaceRepositoryLike,
>(sessions: readonly TSession[]): WorkspaceRepositoryGroup<TSession>[] {
  const sessionsByWorkspaceFolder = new Map<string, TSession[]>();
  for (const session of sessions) {
    const workspaceFolderKey = session.workspaceFolder.uri.fsPath;
    const workspaceSessions =
      sessionsByWorkspaceFolder.get(workspaceFolderKey) ?? [];
    workspaceSessions.push(session);
    sessionsByWorkspaceFolder.set(workspaceFolderKey, workspaceSessions);
  }

  return [...sessionsByWorkspaceFolder.values()].map((workspaceSessions) => ({
    sessions: workspaceSessions,
    directRepositorySession:
      getDirectWorkspaceRepositorySession(workspaceSessions),
  }));
}

export function getDirectWorkspaceRepositorySession<
  TSession extends WorkspaceRepositoryLike,
>(sessions: readonly TSession[]): TSession | undefined {
  if (sessions.length !== 1) {
    return undefined;
  }

  const [session] = sessions;
  return session.repository.rootUri.fsPath === session.workspaceFolder.uri.fsPath
    ? session
    : undefined;
}
