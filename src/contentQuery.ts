export interface BaseContentQuery {
  readonly kind: "base";
  readonly repositoryRoot: string;
  readonly ref: string;
  readonly path: string;
}

export interface EmptyContentQuery {
  readonly kind: "empty";
}

export type ContentQuery = BaseContentQuery | EmptyContentQuery;

export interface BaseContentParams {
  readonly repositoryRoot: string;
  readonly ref: string;
  readonly path: string;
}

export function toBaseContentQuery(
  params: BaseContentParams,
): BaseContentQuery {
  return {
    kind: "base",
    repositoryRoot: params.repositoryRoot,
    ref: params.ref,
    path: params.path,
  };
}

export function toEmptyContentQuery(): EmptyContentQuery {
  return {
    kind: "empty",
  };
}

export function encodeContentQuery(query: ContentQuery): string {
  return JSON.stringify(query);
}

export function decodeContentQuery(query: string): ContentQuery {
  return JSON.parse(query) as ContentQuery;
}
