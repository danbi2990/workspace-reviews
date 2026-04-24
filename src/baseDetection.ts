import { Branch, Repository } from "./types";

export interface BaseDetectionOptions {
  readonly currentBranchName?: string;
  readonly upstreamRemote?: string;
  readonly explicitBaseRef?: string;
  readonly defaultBaseBranches: readonly string[];
}

export function buildBaseRefCandidates(
  options: BaseDetectionOptions,
): string[] {
  if (options.explicitBaseRef) {
    return [options.explicitBaseRef];
  }

  const candidates: string[] = [];
  for (const baseBranch of options.defaultBaseBranches) {
    if (!baseBranch.trim()) {
      continue;
    }

    if (options.upstreamRemote) {
      candidates.push(`${options.upstreamRemote}/${baseBranch}`);
    }

    candidates.push(baseBranch);
  }

  return uniqueStrings(
    candidates.filter((candidate) => candidate !== options.currentBranchName),
  );
}

export function detectBaseRef(options: BaseDetectionOptions): string {
  const candidates = buildBaseRefCandidates(options);
  return candidates[0] ?? "main";
}

export function createBaseDetectionOptions(
  repository: Repository,
  defaultBaseBranches: readonly string[],
  explicitBaseRef?: string,
): BaseDetectionOptions {
  const head: Branch | undefined = repository.state.HEAD;
  return {
    currentBranchName: head?.name,
    upstreamRemote: head?.upstream?.remote,
    explicitBaseRef,
    defaultBaseBranches,
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
