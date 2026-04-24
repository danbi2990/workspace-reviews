import { ChangeLayer, ChangeStatus } from "./model";

export interface ParsedNameStatusEntry {
  readonly path: string;
  readonly status: ChangeStatus;
  readonly layer: ChangeLayer;
  readonly originalPath?: string;
}

export function parseRawNameStatusOutput(
  output: string,
  layer: ChangeLayer,
): ParsedNameStatusEntry[] {
  return output
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => parseRawNameStatusLine(line, layer))
    .filter((value): value is ParsedNameStatusEntry => Boolean(value));
}

function parseRawNameStatusLine(
  line: string,
  layer: ChangeLayer,
): ParsedNameStatusEntry | undefined {
  const parts = line.split("\t");
  const rawStatus = parts[0];

  if (!rawStatus) {
    return undefined;
  }

  if (rawStatus.startsWith("R")) {
    const originalPath = parts[1];
    const renamedPath = parts[2];
    if (!originalPath || !renamedPath) {
      return undefined;
    }

    return {
      path: renamedPath,
      status: "renamed",
      layer,
      originalPath,
    };
  }

  const filePath = parts[1];
  if (!filePath) {
    return undefined;
  }

  return {
    path: filePath,
    status: mapNameStatus(rawStatus),
    layer,
  };
}

function mapNameStatus(rawStatus: string): ChangeStatus {
  const normalized = rawStatus[0] ?? "M";
  switch (normalized) {
    case "A":
      return "added";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    default:
      return "modified";
  }
}
