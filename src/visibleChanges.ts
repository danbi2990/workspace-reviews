import { ChangeEntry, ReviewSession } from "./model";

const LAYER_PRIORITY: Record<ChangeEntry["layer"], number> = {
  committed: 0,
  staged: 1,
  unstaged: 2,
  untracked: 3,
};

export function getVisibleChanges(session: ReviewSession): ChangeEntry[] {
  const merged = new Map<string, ChangeEntry>();
  for (const change of [
    ...session.committedChanges,
    ...session.stagedChanges,
    ...session.unstagedChanges,
    ...session.untrackedChanges,
  ]) {
    const existing = merged.get(change.path);
    if (!existing) {
      merged.set(change.path, change);
      continue;
    }

    if (LAYER_PRIORITY[change.layer] >= LAYER_PRIORITY[existing.layer]) {
      merged.set(change.path, change);
    }
  }

  return [...merged.values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}
