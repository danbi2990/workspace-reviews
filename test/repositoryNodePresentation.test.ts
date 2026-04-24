import test from "node:test";
import assert from "node:assert/strict";
import {
  repositoryNodeDescription,
  repositoryNodeTooltip,
} from "../src/repositoryNodePresentation";

test("repositoryNodeDescription shows the visible change count", () => {
  assert.equal(repositoryNodeDescription(3), "3");
  assert.equal(repositoryNodeDescription(0), "");
});

test("repositoryNodeTooltip includes repo path branch base and comparison base", () => {
  const tooltip = repositoryNodeTooltip({
    repository: {
      rootUri: {
        fsPath: "/tmp/repo",
      },
    },
    currentBranch: "feature/test",
    baseRef: "origin/main",
    comparisonBaseRef: "abc1234",
  } as Parameters<typeof repositoryNodeTooltip>[0]);

  assert.equal(
    tooltip,
    [
      "/tmp/repo",
      "Branch: feature/test",
      "Base: origin/main",
      "Comparison Base: abc1234",
    ].join("\n"),
  );
});
