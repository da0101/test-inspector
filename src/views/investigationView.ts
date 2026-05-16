import * as path from 'path';
import * as vscode from 'vscode';
import { InvestigationReport } from '../models';

export class InvestigationView {
  private panel: vscode.WebviewPanel | undefined;

  show(report: InvestigationReport): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel('testInspector.investigation', 'Test Investigation', vscode.ViewColumn.One, {
        enableCommandUris: ['testInspector.configureLlm', 'testInspector.openFile', 'testInspector.exportInvestigation'],
        localResourceRoots: [],
        retainContextWhenHidden: true
      });
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }
    this.panel.reveal(vscode.ViewColumn.One);
    this.panel.webview.html = render(report);
  }
}

function render(report: InvestigationReport): string {
  const nonce = makeNonce();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Investigation</title>
  <style nonce="${nonce}">
    body { margin: 0; padding: 28px 34px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-family: var(--vscode-font-family); }
    main { max-width: 1100px; }
    h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: 0; }
    h2 { margin-top: 24px; font-size: 17px; letter-spacing: 0; }
    p, li { color: var(--vscode-editor-foreground); line-height: 1.45; }
    .muted { color: var(--vscode-descriptionForeground); }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 10px; margin: 18px 0; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin: 18px 0; }
    a.button { border: 1px solid var(--vscode-button-border, transparent); border-radius: 4px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); padding: 6px 10px; text-decoration: none; }
    a.button.secondary { color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); }
    .card { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; background: var(--vscode-sideBar-background); }
    .label { color: var(--vscode-descriptionForeground); font-size: 12px; margin-bottom: 6px; }
    .value { font-size: 24px; font-weight: 700; }
    .pill { display: inline-flex; border-radius: 999px; padding: 3px 8px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); margin: 0 5px 5px 0; font-size: 12px; }
    pre { white-space: pre-wrap; border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; background: var(--vscode-textCodeBlock-background); overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; border-bottom: 1px solid var(--vscode-panel-border); padding: 8px 6px; vertical-align: top; }
    th { color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(path.basename(report.sourcePath))}</h1>
    <p class="muted">${escapeHtml(report.sourcePath)} · generated ${escapeHtml(report.generatedAt)}</p>
    <div class="actions">
      <a class="button" href="${openFileHref(report.sourcePath)}">Open Source</a>
      ${report.relatedTests[0] ? `<a class="button secondary" href="${openFileHref(report.relatedTests[0])}">Open First Test</a>` : ''}
      <a class="button secondary" href="command:testInspector.exportInvestigation">Export Investigation</a>
    </div>
    <div class="grid">
      ${card('Risk', report.riskScore)}
      ${card('Criticality', report.criticality)}
      ${card('Coverage', report.coverage?.linesPct === undefined ? 'unknown' : `${report.coverage.linesPct}%`)}
      ${card('Related Tests', report.relatedTests.length)}
    </div>
    <h2>Signals</h2>
    <p>${report.signals.map((signal) => `<span class="pill">${escapeHtml(signal)}</span>`).join('') || '<span class="muted">No criticality signals detected.</span>'}</p>
    <h2>Static Source Summary</h2>
    <ul>${report.sourceSummary.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h2>Known Findings</h2>
    ${findingsTable(report)}
    <h2>Related Tests</h2>
    ${relatedTestsTable(report)}
    <h2>Suggested Tests</h2>
    <ul>${report.suggestedTests.map((item) => `<li><strong>${escapeHtml(item.title)}</strong>: ${escapeHtml(item.reason)}</li>`).join('')}</ul>
    <h2>LLM Investigator</h2>
    ${
      report.llmEnabled
        ? `<pre>${escapeHtml(report.llmSummary || 'LLM returned no content.')}</pre>`
        : '<p class="muted">LLM is not configured. Use <a href="command:testInspector.configureLlm">Test Inspector: Configure LLM</a> to enable semantic review.</p>'
    }
  </main>
</body>
</html>`;
}

function relatedTestsTable(report: InvestigationReport): string {
  if (!report.relatedTests.length) {
    return '<p class="muted">No related tests found by current mapping.</p>';
  }
  return `<table><thead><tr><th>Test File</th><th>Action</th></tr></thead><tbody>${report.relatedTests
    .map((testPath) => `<tr><td>${escapeHtml(testPath)}</td><td><a href="${openFileHref(testPath)}">Open</a></td></tr>`)
    .join('')}</tbody></table>`;
}

function openFileHref(filePath: string): string {
  return `command:testInspector.openFile?${encodeURIComponent(JSON.stringify([filePath]))}`;
}

function findingsTable(report: InvestigationReport): string {
  const findings = [...report.deterministicFindings, ...report.weakTestFindings];
  if (!findings.length) {
    return '<p class="muted">No deterministic findings for this source/test pair.</p>';
  }
  return `<table><thead><tr><th>Kind</th><th>Message</th><th>File</th></tr></thead><tbody>${findings
    .map((finding) => `<tr><td>${escapeHtml(finding.kind)}</td><td>${escapeHtml(finding.message)}</td><td>${escapeHtml(finding.filePath)}</td></tr>`)
    .join('')}</tbody></table>`;
}

function card(label: string, value: string | number): string {
  return `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(String(value))}</div></div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function makeNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 24; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
