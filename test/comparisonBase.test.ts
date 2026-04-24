import test from "node:test";
import assert from "node:assert/strict";
import { resolveComparisonBaseRef } from "../src/comparisonBase";

test("resolveComparisonBaseRef prefers merge-base output when present", () => {
  assert.equal(resolveComparisonBaseRef("origin/main", "abc1234\n"), "abc1234");
});

test("resolveComparisonBaseRef falls back to baseRef for blank output", () => {
  assert.equal(resolveComparisonBaseRef("origin/main", " \n"), "origin/main");
});
