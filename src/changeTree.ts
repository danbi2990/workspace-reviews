import { ChangeEntry } from "./model";

export interface ChangeTreeDirectory {
  readonly kind: "directory";
  readonly name: string;
  readonly relativePath: string;
  readonly children: readonly ChangeTreeNode[];
}

export interface ChangeTreeFile {
  readonly kind: "file";
  readonly change: ChangeEntry;
}

export type ChangeTreeNode = ChangeTreeDirectory | ChangeTreeFile;

interface MutableDirectory {
  readonly name: string;
  readonly relativePath: string;
  readonly directories: Map<string, MutableDirectory>;
  readonly files: ChangeEntry[];
}

export function buildChangeTree(
  changes: readonly ChangeEntry[],
): ChangeTreeNode[] {
  const root = createMutableDirectory("", "");

  for (const change of changes) {
    const segments = splitPath(change.path);
    const fileName = segments.pop();
    if (!fileName) {
      continue;
    }

    let current = root;
    const pathParts: string[] = [];
    for (const segment of segments) {
      pathParts.push(segment);
      let next = current.directories.get(segment);
      if (!next) {
        next = createMutableDirectory(segment, pathParts.join("/"));
        current.directories.set(segment, next);
      }
      current = next;
    }

    current.files.push(change);
  }

  return materializeDirectory(root);
}

function createMutableDirectory(
  name: string,
  relativePath: string,
): MutableDirectory {
  return {
    name,
    relativePath,
    directories: new Map(),
    files: [],
  };
}

function materializeDirectory(directory: MutableDirectory): ChangeTreeNode[] {
  const childDirectories = [...directory.directories.values()]
    .map((child) => materializeSingleDirectory(child))
    .sort((left, right) => left.name.localeCompare(right.name));

  const childFiles = [...directory.files]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((change) => ({
      kind: "file" as const,
      change,
    }));

  return [...childDirectories, ...childFiles];
}

function materializeSingleDirectory(
  directory: MutableDirectory,
): ChangeTreeDirectory {
  let current = directory;
  const nameParts = [directory.name];

  while (current.files.length === 0 && current.directories.size === 1) {
    const [onlyChild] = current.directories.values();
    if (!onlyChild) {
      break;
    }

    current = onlyChild;
    nameParts.push(current.name);
  }

  return {
    kind: "directory",
    name: nameParts.join("/"),
    relativePath: current.relativePath,
    children: materializeDirectory(current),
  };
}

function splitPath(filePath: string): string[] {
  return filePath.split(/[\\/]+/).filter((segment) => segment.length > 0);
}
