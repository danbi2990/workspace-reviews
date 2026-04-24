import * as vscode from "vscode";
import {
  BaseContentParams,
  ContentQuery,
  decodeContentQuery,
  encodeContentQuery,
  toBaseContentQuery,
  toEmptyContentQuery,
} from "./contentQuery";
import { getBaseFileContent } from "./gitDiff";

export const BASE_CONTENT_SCHEME = "workspace-reviews-base";

export class BaseContentProvider
  implements vscode.TextDocumentContentProvider, vscode.Disposable
{
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this.onDidChangeEmitter.event;

  dispose(): void {
    this.onDidChangeEmitter.dispose();
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const query = parseQuery(uri);
    if (query.kind === "empty") {
      return "";
    }

    return getBaseFileContent(query.repositoryRoot, query.ref, query.path);
  }
}

export function toBaseContentUri(params: BaseContentParams): vscode.Uri {
  return vscode.Uri.from({
    scheme: BASE_CONTENT_SCHEME,
    path: `/${params.path}`,
    query: encodeContentQuery(toBaseContentQuery(params)),
  });
}

export function emptyDocumentUri(): vscode.Uri {
  return vscode.Uri.from({
    scheme: BASE_CONTENT_SCHEME,
    path: "/empty",
    query: encodeContentQuery(toEmptyContentQuery()),
  });
}

function parseQuery(uri: vscode.Uri): ContentQuery {
  return decodeContentQuery(uri.query);
}
