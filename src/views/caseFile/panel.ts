import * as crypto from 'node:crypto';
import * as vscode from 'vscode';
import { renderCaseFileHtml } from './template';
import { emptyBundle, type CaseFileBundle } from '../../services/caseFile';

type IncomingMessage =
  | { type: 'open'; path?: string }
  | { type: 'copy'; text?: string }
  | { type: 'evidence'; path?: string }
  | { type: 'review'; path?: string }
  | { type: 'rescan'; path?: string };

export class CaseFilePanel {
  private static current: CaseFilePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private bundle: CaseFileBundle;
  private disposed = false;

  private constructor(panel: vscode.WebviewPanel, initial: CaseFileBundle) {
    this.panel = panel;
    this.bundle = initial;
    this.panel.onDidDispose(() => {
      this.disposed = true;
      if (CaseFilePanel.current === this) {
        CaseFilePanel.current = undefined;
      }
    });
    this.panel.webview.onDidReceiveMessage((msg: IncomingMessage) => this.handleMessage(msg));
    this.render();
  }

  static show(context: vscode.ExtensionContext): CaseFilePanel {
    if (CaseFilePanel.current && !CaseFilePanel.current.disposed) {
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
    CaseFilePanel.current = new CaseFilePanel(panel, emptyBundle());
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
      case 'evidence':
        // Handled client-side in the webview script (toggle visibility).
        return;
    }
  }
}
