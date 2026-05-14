import test from "node:test";
import assert from "node:assert/strict";
import { formatRepositoryLabel } from "../src/repositoryLabel";

test("formatRepositoryLabel uses ./ for root repositories", () => {
  const label = formatRepositoryLabel(
    {
      name: "workspace-reviews",
      uri: {
        fsPath: "/workspaces/workspace-reviews",
      },
    },
    {
      rootUri: {
        fsPath: "/workspaces/workspace-reviews",
      },
    },
  );

  assert.equal(label, "./");
});

test("formatRepositoryLabel uses the repository name for nested repositories", () => {
  const label = formatRepositoryLabel(
    {
      name: "vsc-extensions",
      uri: {
        fsPath: "/workspaces/vsc-extensions",
      },
    },
    {
      rootUri: {
        fsPath: "/workspaces/vsc-extensions/workspace-reviews",
      },
    },
  );

  assert.equal(label, "workspace-reviews");
});
