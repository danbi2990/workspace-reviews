import test from "node:test";
import assert from "node:assert/strict";
import {
  formatAbsolutePathsForTerminal,
  resolveAbsolutePathsForSend,
} from "../src/sendPathToTerminal";

test("resolveAbsolutePathsForSend uses all selected items when no explicit item is provided", () => {
  const absolutePaths = resolveAbsolutePathsForSend(
    undefined,
    [
      { absolutePath: "/tmp/one" },
      { absolutePath: "/tmp/two" },
    ],
    (value) =>
      typeof value === "object" &&
      value !== null &&
      "absolutePath" in value &&
      typeof value.absolutePath === "string"
        ? value.absolutePath
        : undefined,
  );

  assert.deepEqual(absolutePaths, ["/tmp/one", "/tmp/two"]);
});

test("resolveAbsolutePathsForSend prefers the explicit item over the selection", () => {
  const absolutePaths = resolveAbsolutePathsForSend(
    { absolutePath: "/tmp/item" },
    [
      { absolutePath: "/tmp/one" },
      { absolutePath: "/tmp/two" },
    ],
    (value) =>
      typeof value === "object" &&
      value !== null &&
      "absolutePath" in value &&
      typeof value.absolutePath === "string"
        ? value.absolutePath
        : undefined,
  );

  assert.deepEqual(absolutePaths, ["/tmp/item"]);
});

test("formatAbsolutePathsForTerminal joins paths with a comma and space", () => {
  assert.equal(
    formatAbsolutePathsForTerminal(["/tmp/one", "/tmp/two"]),
    "/tmp/one, /tmp/two",
  );
  assert.equal(formatAbsolutePathsForTerminal([]), undefined);
});
