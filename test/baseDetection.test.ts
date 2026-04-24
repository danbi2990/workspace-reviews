import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBaseRefCandidates,
  detectBaseRef,
} from "../src/baseDetection";

test("buildBaseRefCandidates prefers upstream-prefixed refs first", () => {
  const candidates = buildBaseRefCandidates({
    currentBranchName: "feature/workspace-review",
    upstreamRemote: "origin",
    defaultBaseBranches: ["main", "develop"],
  });

  assert.deepEqual(candidates, [
    "origin/main",
    "main",
    "origin/develop",
    "develop",
  ]);
});

test("detectBaseRef respects explicit override", () => {
  const detected = detectBaseRef({
    currentBranchName: "feature/workspace-review",
    upstreamRemote: "origin",
    explicitBaseRef: "upstream/release",
    defaultBaseBranches: ["main", "develop"],
  });

  assert.equal(detected, "upstream/release");
});

test("buildBaseRefCandidates skips blank entries and current branch", () => {
  const candidates = buildBaseRefCandidates({
    currentBranchName: "main",
    upstreamRemote: undefined,
    defaultBaseBranches: ["", "main", "develop"],
  });

  assert.deepEqual(candidates, ["develop"]);
});
