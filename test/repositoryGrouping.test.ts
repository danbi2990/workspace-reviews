import test from "node:test";
import assert from "node:assert/strict";
import {
  getDirectWorkspaceRepositorySession,
  groupSessionsByWorkspaceFolder,
} from "../src/repositoryGrouping";

function session(workspaceFolderPath: string, repositoryPath: string) {
  return {
    workspaceFolder: {
      uri: {
        fsPath: workspaceFolderPath,
      },
    },
    repository: {
      rootUri: {
        fsPath: repositoryPath,
      },
    },
  };
}

test("getDirectWorkspaceRepositorySession returns the root repository when it is the only repository", () => {
  const rootSession = session("/workspaces/home", "/workspaces/home");

  assert.equal(getDirectWorkspaceRepositorySession([rootSession]), rootSession);
});

test("getDirectWorkspaceRepositorySession keeps explicit repository nodes when nested repositories are present", () => {
  const rootSession = session("/workspaces/home", "/workspaces/home");
  const nestedSession = session("/workspaces/home", "/workspaces/home/tools");

  assert.equal(
    getDirectWorkspaceRepositorySession([rootSession, nestedSession]),
    undefined,
  );
});

test("groupSessionsByWorkspaceFolder preserves workspace folder groups in discovery order", () => {
  const homeSession = session("/workspaces/home", "/workspaces/home");
  const toolsSession = session("/workspaces/tools", "/workspaces/tools/repo");

  const groups = groupSessionsByWorkspaceFolder([homeSession, toolsSession]);

  assert.deepEqual(
    groups.map((group) =>
      group.sessions.map((groupSession) => groupSession.repository.rootUri.fsPath),
    ),
    [["/workspaces/home"], ["/workspaces/tools/repo"]],
  );
});
