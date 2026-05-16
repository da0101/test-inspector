import * as crypto from 'node:crypto';
import * as vscode from 'vscode';
import { renderCaseFileHtml } from './template';
import { emptyBundle, type CaseFile, type CaseFileAiReview, type CaseFileBundle } from '../../services/caseFile';

type IncomingMessage =
  | { type: 'open'; path?: string }
  | { type: 'copy'; text?: string }
  | { type: 'evidence'; path?: string }
  | { type: 'aiReview'; path?: string }
  | { type: 'review'; path?: string }
  | { type: 'rescan'; path?: string };

type CaseFilePanelOptions = {
  onAiReview?: (caseFile: CaseFile, bundle: CaseFileBundle) => Promise<CaseFileAiReview>;
};

export class CaseFilePanel {
  private static current: CaseFilePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private bundle: CaseFileBundle;
  private disposed = false;
  private options: CaseFilePanelOptions;

  private constructor(panel: vscode.WebviewPanel, initial: CaseFileBundle, options: CaseFilePanelOptions) {
    this.panel = panel;
    this.bundle = initial;
    this.options = options;
    this.panel.onDidDispose(() => {
      this.disposed = true;
      if (CaseFilePanel.current === this) {
        CaseFilePanel.current = undefined;
      }
    });
    this.panel.webview.onDidReceiveMessage((msg: IncomingMessage) => this.handleMessage(msg));
    this.render();
  }

  static show(context: vscode.ExtensionContext, options: CaseFilePanelOptions = {}): CaseFilePanel {
    if (CaseFilePanel.current && !CaseFilePanel.current.disposed) {
      CaseFilePanel.current.options = options;
      CaseFilePanel.current.panel.reveal();
      return CaseFilePanel.current;
    }
    const panel = vscode.window.createWebviewPanel(
      'testInspectorCaseFile',
      'Test Inspector — Case File',
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true },
    );
    panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'test-inspector.svg');
    CaseFilePanel.current = new CaseFilePanel(panel, emptyBundle(), options);
    return CaseFilePanel.current;
  }

  update(bundle: CaseFileBundle): void {
    this.bundle = bundle;
    this.render();
  }

  private render(): void {
    const nonce = crypto.randomBytes(16).toString('base64');
    const cspSource = this.panel.webview.cspSource;
    this.panel.webview.html = renderCaseFileHtml(this.bundle, { nonce, cspSource });
  }

  private handleMessage(msg: IncomingMessage): void {
    switch (msg.type) {
      case 'open':
        if (msg.path) {
          vscode.commands.executeCommand('vscode.open', vscode.Uri.file(msg.path));
        }
        return;
      case 'copy':
        if (msg.text) {
          void vscode.env.clipboard.writeText(msg.text);
          void vscode.window.showInformationMessage('Suggestion copied to clipboard.');
        }
        return;
      case 'review':
        if (msg.path) {
          void vscode.commands.executeCommand('_testInspector.markReviewed', msg.path);
        }
        return;
      case 'rescan':
        void vscode.commands.executeCommand('testInspector.refresh');
        return;
      case 'aiReview':
        if (msg.path) {
          void this.reviewWithAi(msg.path);
        }
        return;
      case 'evidence':
        // Handled client-side in the webview script (toggle visibility).
        return;
    }
  }

  private async reviewWithAi(filePath: string): Promise<void> {
    const target = this.bundle.cases.find((c) => c.target.path === filePath);
    if (!target || !this.options.onAiReview) {
      void vscode.window.showWarningMessage('Test Inspector: AI reviewer is not configured.');
      this.render();
      return;
    }
    const review = await this.options.onAiReview(target, this.bundle);
    this.bundle.cases = this.bundle.cases.map((c) => (c.target.path === filePath ? { ...c, aiReview: review } : c));
    this.render();
  }
}
