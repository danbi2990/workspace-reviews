export function resolveTreeItemAbsolutePath(item?: unknown): string | undefined {
  if (
    typeof item === "object" &&
    item !== null &&
    "absolutePath" in item &&
    typeof item.absolutePath === "string"
  ) {
    return item.absolutePath;
  }

  return undefined;
}
