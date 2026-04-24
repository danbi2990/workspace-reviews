import * as vscode from "vscode";
import {
  decodeDecorationMetadata,
  decorationPresentation,
} from "./fileDecorationData";

export class WorkspaceReviewDecorationProvider
  implements vscode.FileDecorationProvider, vscode.Disposable
{
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChangeFileDecorations = this.onDidChangeEmitter.event;

  dispose(): void {
    this.onDidChangeEmitter.dispose();
  }

  provideFileDecoration(
    uri: vscode.Uri,
  ): vscode.ProviderResult<vscode.FileDecoration> {
    const metadata = decodeDecorationMetadata(uri.query);
    if (!metadata) {
      return undefined;
    }

    const presentation = decorationPresentation(metadata);
    return {
      propagate: false,
      badge: metadata.kind === "file" || !metadata.kind ? presentation.badge : undefined,
      color: new vscode.ThemeColor(presentation.colorId),
      tooltip: presentation.tooltip,
    };
  }
}
