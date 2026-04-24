import test from "node:test";
import assert from "node:assert/strict";
import { toChangeSelection } from "../src/changeSelection";
import type { ChangeEntry, ReviewSession } from "../src/model";

test("toChangeSelection captures everything needed to open a diff", () => {
  const session = {
    baseRef: "origin/main",
    comparisonBaseRef: "abc1234",
    repository: {
      rootUri: {
        fsPath: "/tmp/repo",
      },
    },
  } as ReviewSession;

  const change = {
    path: "src/tree.ts",
    uri: {
      toString: () => "file:///tmp/repo/src/tree.ts",
    },
    layer: "unstaged",
    status: "modified",
    originalPath: "src/tree.ts",
  } as ChangeEntry;

  const selection = toChangeSelection(session, change);

  assert.deepEqual(selection, {
    repositoryRoot: "/tmp/repo",
    baseRef: "origin/main",
    comparisonBaseRef: "abc1234",
    path: "src/tree.ts",
    fileUri: "file:///tmp/repo/src/tree.ts",
    layer: "unstaged",
    status: "modified",
    originalPath: "src/tree.ts",
  });
});
