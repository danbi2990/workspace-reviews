import test from "node:test";
import assert from "node:assert/strict";
import { createReviewDiffPlan } from "../src/diffView";
import type { ChangeSelection } from "../src/changeSelection";

test("createReviewDiffPlan uses base content for modified files", () => {
  const selection = createSelection({
    status: "modified",
    path: "src/tree.ts",
    fileUri: "file:///tmp/repo/src/tree.ts",
  });

  const diffPlan = createReviewDiffPlan(selection, true);

  assert.deepEqual(diffPlan.left, {
    kind: "baseContent",
    path: "src/tree.ts",
  });
  assert.deepEqual(diffPlan.right, {
    kind: "workingCopy",
    fileUri: selection.fileUri,
  });
  assert.equal(diffPlan.title, "tree.ts (origin/main ↔ working tree)");
  assert.equal(diffPlan.preserveFocus, false);
});

test("createReviewDiffPlan uses empty base for added files", () => {
  const selection = createSelection({
    status: "added",
    path: "src/new.ts",
    fileUri: "file:///tmp/repo/src/new.ts",
  });

  const diffPlan = createReviewDiffPlan(selection, true);

  assert.deepEqual(diffPlan.left, {
    kind: "empty",
  });
  assert.deepEqual(diffPlan.right, {
    kind: "workingCopy",
    fileUri: selection.fileUri,
  });
});

test("createReviewDiffPlan uses originalPath for renamed files", () => {
  const selection = createSelection({
    status: "renamed",
    path: "src/new.ts",
    originalPath: "src/old.ts",
    fileUri: "file:///tmp/repo/src/new.ts",
  });

  const diffPlan = createReviewDiffPlan(selection, true);

  assert.deepEqual(diffPlan.left, {
    kind: "baseContent",
    path: "src/old.ts",
  });
});

test("createReviewDiffPlan uses empty working copy for deleted files", () => {
  const selection = createSelection({
    status: "deleted",
    path: "src/old.ts",
    fileUri: "file:///tmp/repo/src/old.ts",
  });

  const diffPlan = createReviewDiffPlan(selection, false);

  assert.deepEqual(diffPlan.left, {
    kind: "baseContent",
    path: "src/old.ts",
  });
  assert.deepEqual(diffPlan.right, {
    kind: "empty",
  });
});

test("createReviewDiffPlan uses empty working copy when file is missing", () => {
  const selection = createSelection({
    status: "modified",
    path: "src/tree.ts",
    fileUri: "file:///tmp/repo/src/tree.ts",
  });

  const diffPlan = createReviewDiffPlan(selection, false);

  assert.deepEqual(diffPlan.right, {
    kind: "empty",
  });
});

function createSelection(
  overrides: Partial<ChangeSelection>,
): ChangeSelection {
  return {
    repositoryRoot: "/tmp/repo",
    baseRef: "origin/main",
    comparisonBaseRef: "abc1234",
    path: "src/tree.ts",
    fileUri: "file:///tmp/repo/src/tree.ts",
    layer: "unstaged",
    status: "modified",
    ...overrides,
  };
}
