import test from "node:test";
import assert from "node:assert/strict";
import { buildChangeTree } from "../src/changeTree";
import type { ChangeEntry } from "../src/model";

test("buildChangeTree nests files under directories", () => {
  const changes = [
    { path: "src/tree.ts" },
    { path: "src/git/diff.ts" },
    { path: "README.md" },
  ] as ChangeEntry[];

  const tree = buildChangeTree(changes);

  assert.equal(tree.length, 2);
  assert.equal(tree[0]?.kind, "directory");
  assert.equal(tree[1]?.kind, "file");

  if (tree[0]?.kind !== "directory") {
    throw new Error("Expected directory node");
  }

  assert.equal(tree[0].name, "src");
  assert.equal(tree[0].children.length, 2);
});

test("buildChangeTree sorts directories before files", () => {
  const changes = [
    { path: "z-last.ts" },
    { path: "a-first.ts" },
    { path: "src/tree.ts" },
  ] as ChangeEntry[];

  const tree = buildChangeTree(changes);

  assert.equal(tree[0]?.kind, "directory");
  assert.equal(tree[1]?.kind, "file");
  assert.equal(tree[2]?.kind, "file");
});

test("buildChangeTree keeps root files alongside directories", () => {
  const changes = [
    { path: "Cargo.toml" },
    { path: "src/tree.ts" },
  ] as ChangeEntry[];

  const tree = buildChangeTree(changes);

  assert.equal(tree.length, 2);
  assert.equal(tree[0]?.kind, "directory");
  assert.equal(tree[1]?.kind, "file");

  if (tree[1]?.kind !== "file") {
    throw new Error("Expected root file node");
  }

  assert.equal(tree[1].change.path, "Cargo.toml");
});

test("buildChangeTree compresses single-child directory chains", () => {
  const changes = [
    { path: "src/github/tree.ts" },
    { path: "src/github/git.ts" },
  ] as ChangeEntry[];

  const tree = buildChangeTree(changes);

  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.kind, "directory");

  if (tree[0]?.kind !== "directory") {
    throw new Error("Expected compressed directory node");
  }

  assert.equal(tree[0].name, "src/github");
  assert.equal(tree[0].relativePath, "src/github");
  assert.equal(tree[0].children.length, 2);
});
