import test from "node:test";
import assert from "node:assert/strict";
import { resolveTreeItemAbsolutePath } from "../src/treePath";

test("resolveTreeItemAbsolutePath returns absolutePath from tree items", () => {
  assert.equal(
    resolveTreeItemAbsolutePath({
      absolutePath: "/tmp/repo",
    }),
    "/tmp/repo",
  );
});

test("resolveTreeItemAbsolutePath ignores items without absolutePath", () => {
  assert.equal(resolveTreeItemAbsolutePath(undefined), undefined);
  assert.equal(resolveTreeItemAbsolutePath({}), undefined);
  assert.equal(
    resolveTreeItemAbsolutePath({
      absolutePath: 123,
    }),
    undefined,
  );
});
