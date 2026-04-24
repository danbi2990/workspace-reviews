import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateDecorationStatus,
  decodeDecorationMetadata,
  decorationBadge,
  decorationColorId,
  decorationPresentation,
  decorationTooltip,
  encodeDecorationMetadata,
} from "../src/fileDecorationData";

test("decoration metadata round-trips through query encoding", () => {
  const encoded = encodeDecorationMetadata({
    kind: "file",
    status: "renamed",
    originalPath: "src/old.ts",
  });

  assert.deepEqual(decodeDecorationMetadata(encoded), {
    kind: "file",
    status: "renamed",
    originalPath: "src/old.ts",
  });
});

test("decoration metadata decode ignores invalid JSON", () => {
  assert.equal(decodeDecorationMetadata("not-json"), undefined);
});

test("decorationBadge returns compact status letters", () => {
  assert.equal(decorationBadge("modified"), "M");
  assert.equal(decorationBadge("added"), "A");
  assert.equal(decorationBadge("untracked"), "A");
  assert.equal(decorationBadge("deleted"), "D");
  assert.equal(decorationBadge("renamed"), "R");
});

test("decorationColorId maps to git decoration colors", () => {
  assert.equal(
    decorationColorId("modified"),
    "gitDecoration.modifiedResourceForeground",
  );
  assert.equal(
    decorationColorId("added"),
    "gitDecoration.addedResourceForeground",
  );
  assert.equal(
    decorationColorId("deleted"),
    "gitDecoration.deletedResourceForeground",
  );
  assert.equal(
    decorationColorId("renamed"),
    "gitDecoration.renamedResourceForeground",
  );
  assert.equal(
    decorationColorId("untracked"),
    "gitDecoration.addedResourceForeground",
  );
});

test("decorationTooltip includes rename source when available", () => {
  assert.equal(
    decorationTooltip({
      status: "renamed",
      originalPath: "src/old.ts",
    }),
    "Renamed src/old.ts",
  );
  assert.equal(decorationTooltip({ status: "modified" }), "Modified");
  assert.equal(decorationTooltip({ status: "untracked" }), "Added");
});

test("decorationPresentation combines badge color and tooltip", () => {
  assert.deepEqual(
    decorationPresentation({
      status: "deleted",
    }),
    {
      badge: "D",
      colorId: "gitDecoration.deletedResourceForeground",
      tooltip: "Deleted",
    },
  );
});

test("aggregateDecorationStatus prefers added over other states", () => {
  assert.equal(
    aggregateDecorationStatus(["deleted", "renamed", "modified", "added"]),
    "added",
  );
  assert.equal(
    aggregateDecorationStatus(["deleted", "renamed", "modified"]),
    "modified",
  );
  assert.equal(
    aggregateDecorationStatus(["deleted", "renamed"]),
    "renamed",
  );
  assert.equal(
    aggregateDecorationStatus(["deleted"]),
    "deleted",
  );
  assert.equal(aggregateDecorationStatus([]), undefined);
});
