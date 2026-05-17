import * as crypto from 'node:crypto';
import * as vscode from 'vscode';
import { emptyBundle, type CaseFileBundle, type CaseVerdict } from '../../services/caseFile';
import type { CaseFileReportMode } from '../../services/exportMarkdown';
import { renderReportsHtml, type ReportsState } from './template';

type IncomingMessage = {
  type: 'generate';
  mode: CaseFileReportMode;
  verdicts: CaseVerdict[];
} | {
  type: 'coverage';
};

export class ReportsViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'testInspector.reports';

  private view: vscode.WebviewView | undefined;
  private bundle: CaseFileBundle = emptyBundle();
  private status: ReportsState['status'];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly onGenerate: (
      mode: CaseFileReportMode,
      verdicts: CaseVerdict[],
      onProgress: (message: string) => void
    ) => Promise<boolean>,
    private readonly onGenerateCoverage?: (onProgress: (message: string) => void) => Promise<boolean>
  ) {}

  async resolveWebviewView(view: vscode.WebviewView): Promise<void> {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    view.webview.onDidReceiveMessage((msg: IncomingMessage) => this.handleMessage(msg));
    await this.render();
  }

  update(bundle: CaseFileBundle): void {
    this.bundle = bundle;
    this.status = undefined;
    void this.render();
  }

  focus(): void {
    void vscode.commands.executeCommand(`${ReportsViewProvider.viewType}.focus`);
  }

  private async handleMessage(msg: IncomingMessage): Promise<void> {
    if (msg.type === 'coverage') {
      if (!this.onGenerateCoverage) {
        this.setProgress('error', 'Coverage generation is not available.');
        return;
      }
      this.setProgress('working', 'Preparing coverage...');
      try {
        const ok = await this.onGenerateCoverage((message) => this.setProgress('working', message));
        this.setProgress(ok ? 'ok' : 'idle', ok ? 'Coverage generated. Rescanning...' : 'Coverage cancelled.');
      } catch (err) {
        this.setProgress('error', err instanceof Error ? err.message : String(err));
      }
      return;
    }
    if (msg.type !== 'generate') return;
    if (!msg.verdicts.length) {
      this.setProgress('error', 'Choose at least one group.');
      return;
    }
    this.setProgress('working', msg.mode === 'ai' ? 'Starting AI report...' : 'Preparing report...');
    try {
      const exported = await this.onGenerate(msg.mode, msg.verdicts, (message) => this.setProgress('working', message));
      this.setProgress(exported ? 'ok' : 'idle', exported ? 'Report exported.' : 'Export cancelled.');
    } catch (err) {
      this.setProgress('error', err instanceof Error ? err.message : String(err));
    }
  }

  private setProgress(kind: NonNullable<ReportsState['status']>['kind'], message: string): void {
    this.status = { kind, message };
    if (this.view) {
      void this.view.webview.postMessage({ type: 'progress', kind, message });
    }
  }

  private async render(): Promise<void> {
    if (!this.view) return;
    const nonce = crypto.randomBytes(16).toString('base64');
    this.view.webview.html = renderReportsHtml(
      { bundle: this.bundle, status: this.status },
      { nonce, cspSource: this.view.webview.cspSource }
    );
  }
}
