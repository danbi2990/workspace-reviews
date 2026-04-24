export function resolveComparisonBaseRef(
  baseRef: string,
  mergeBaseOutput: string,
): string {
  const mergeBaseRef = mergeBaseOutput.trim();
  return mergeBaseRef.length > 0 ? mergeBaseRef : baseRef;
}
