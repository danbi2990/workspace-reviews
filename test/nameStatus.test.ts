import test from "node:test";
import assert from "node:assert/strict";
import { parseRawNameStatusOutput } from "../src/nameStatus";

test("parseRawNameStatusOutput handles modified and renamed entries", () => {
  const entries = parseRawNameStatusOutput(
    ["M\tsrc/extension.ts", "R100\tsrc/old.ts\tsrc/new.ts"].join("\n"),
    "committed",
  );

  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.status, "modified");
  assert.equal(entries[0]?.path, "src/extension.ts");
  assert.equal(entries[1]?.status, "renamed");
  assert.equal(entries[1]?.originalPath, "src/old.ts");
  assert.equal(entries[1]?.path, "src/new.ts");
});

test("parseRawNameStatusOutput handles added and deleted entries", () => {
  const entries = parseRawNameStatusOutput(
    ["A\tsrc/new.ts", "D\tsrc/removed.ts"].join("\n"),
    "committed",
  );

  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.status, "added");
  assert.equal(entries[0]?.path, "src/new.ts");
  assert.equal(entries[1]?.status, "deleted");
  assert.equal(entries[1]?.path, "src/removed.ts");
});
