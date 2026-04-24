import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeContentQuery,
  encodeContentQuery,
  toBaseContentQuery,
  toEmptyContentQuery,
} from "../src/contentQuery";

test("base content query round-trips through encoding", () => {
  const query = toBaseContentQuery({
    repositoryRoot: "/tmp/repo",
    ref: "abc1234",
    path: "src/tree.ts",
  });

  assert.deepEqual(decodeContentQuery(encodeContentQuery(query)), query);
});

test("empty content query round-trips through encoding", () => {
  const query = toEmptyContentQuery();

  assert.deepEqual(decodeContentQuery(encodeContentQuery(query)), query);
});
