import type { ChangeStatus } from "./model";

export interface DecorationMetadata {
  readonly kind?: "file" | "container";
  readonly status: ChangeStatus;
  readonly originalPath?: string;
}

export interface DecorationPresentation {
  readonly badge: string;
  readonly colorId: string;
  readonly tooltip: string;
}

const STATUS_PRESENTATIONS: Record<
  ChangeStatus,
  Omit<DecorationPresentation, "tooltip">
> = {
  modified: {
    badge: "M",
    colorId: "gitDecoration.modifiedResourceForeground",
  },
  added: {
    badge: "A",
    colorId: "gitDecoration.addedResourceForeground",
  },
  deleted: {
    badge: "D",
    colorId: "gitDecoration.deletedResourceForeground",
  },
  renamed: {
    badge: "R",
    colorId: "gitDecoration.renamedResourceForeground",
  },
  untracked: {
    badge: "A",
    colorId: "gitDecoration.addedResourceForeground",
  },
};

const STATUS_PRIORITY: Record<ChangeStatus, number> = {
  added: 4,
  untracked: 4,
  modified: 3,
  renamed: 2,
  deleted: 1,
};

export function encodeDecorationMetadata(
  metadata: DecorationMetadata,
): string {
  return JSON.stringify(metadata);
}

export function decodeDecorationMetadata(
  query: string,
): DecorationMetadata | undefined {
  if (!query) {
    return undefined;
  }

  try {
    return JSON.parse(query) as DecorationMetadata;
  } catch {
    return undefined;
  }
}

export function decorationBadge(status: ChangeStatus): string {
  return STATUS_PRESENTATIONS[status].badge;
}

export function decorationColorId(
  status: ChangeStatus,
): string | undefined {
  return STATUS_PRESENTATIONS[status].colorId;
}

export function decorationTooltip(metadata: DecorationMetadata): string {
  if (metadata.status === "renamed" && metadata.originalPath) {
    return `Renamed ${metadata.originalPath}`;
  }

  switch (metadata.status) {
    case "added":
    case "untracked":
      return "Added";
    case "deleted":
      return "Deleted";
    case "renamed":
      return "Renamed";
    default:
      return "Modified";
  }
}

export function decorationPresentation(
  metadata: DecorationMetadata,
): DecorationPresentation {
  return {
    badge: decorationBadge(metadata.status),
    colorId: decorationColorId(metadata.status) ?? "",
    tooltip: decorationTooltip(metadata),
  };
}

export function aggregateDecorationStatus(
  statuses: readonly ChangeStatus[],
): ChangeStatus | undefined {
  let bestStatus: ChangeStatus | undefined;
  let bestPriority = -1;

  for (const status of statuses) {
    const priority = STATUS_PRIORITY[status];
    if (priority > bestPriority) {
      bestStatus = status;
      bestPriority = priority;
    }
  }

  return bestStatus;
}
