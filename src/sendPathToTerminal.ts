export function resolveAbsolutePathsForSend(
  item: unknown,
  selection: readonly unknown[],
  resolvePath: (value: unknown) => string | undefined,
): string[] {
  const targets = item ? [item] : selection;

  return targets.flatMap((target) => {
    const absolutePath = resolvePath(target);
    return absolutePath ? [absolutePath] : [];
  });
}

export function formatAbsolutePathsForTerminal(
  absolutePaths: readonly string[],
): string | undefined {
  if (absolutePaths.length === 0) {
    return undefined;
  }

  return absolutePaths.join(", ");
}
