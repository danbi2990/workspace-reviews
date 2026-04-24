import test from "node:test";
import assert from "node:assert/strict";
import { getVisibleChanges } from "../src/visibleChanges";
import type { ChangeEntry, ReviewSession } from "../src/model";

test("getVisibleChanges flattens all layers into one ordered list", () => {
  const session = {
    committedChanges: [
      { path: "src/b.ts", layer: "committed" },
      { path: "src/a.ts", layer: "committed" },
    ],
    stagedChanges: [],
    unstagedChanges: [],
    untrackedChanges: [],
  } as ReviewSession;

  const visible = getVisibleChanges(session);

  assert.deepEqual(
    visible.map((change) => change.path),
    ["src/a.ts", "src/b.ts"],
  );
});

test("getVisibleChanges prefers the most current layer for the same path", () => {
  const committed = {
    path: "src/tree.ts",
    layer: "committed",
    status: "modified",
  } as ChangeEntry;
  const staged = {
    path: "src/tree.ts",
    layer: "staged",
    status: "modified",
  } as ChangeEntry;
  const unstaged = {
    path: "src/tree.ts",
    layer: "unstaged",
    status: "modified",
  } as ChangeEntry;

  const session = {
    committedChanges: [committed],
    stagedChanges: [staged],
    unstagedChanges: [unstaged],
    untrackedChanges: [],
  } as ReviewSession;

  const visible = getVisibleChanges(session);

  assert.equal(visible.length, 1);
  assert.equal(visible[0]?.layer, "unstaged");
});
