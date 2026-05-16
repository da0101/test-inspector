import * as vscode from 'vscode';
import { FeatureInvestigationReport } from '../models';

export class FeatureInvestigationView {
  private panel: vscode.WebviewPanel | undefined;

  show(report: FeatureInvestigationReport): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel('testInspector.featureInvestigation', 'Feature Investigation', vscode.ViewColumn.One, {
        enableCommandUris: ['testInspector.runFeatureTests', 'testInspector.exportFeatureInvestigation', 'testInspector.configureLlm'],
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

function render(report: FeatureInvestigationReport): string {
  const nonce = makeNonce();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Investigation</title>
  <style nonce="${nonce}">
    body { margin: 0; padding: 28px 34px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-family: var(--vscode-font-family); }
    main { max-width: 1160px; }
    h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: 0; }
    h2 { margin-top: 24px; font-size: 17px; letter-spacing: 0; }
    .muted { color: var(--vscode-descriptionForeground); }
    .grid { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 10px; margin: 18px 0; }
    .card, section { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; background: var(--vscode-sideBar-background); }
    section { margin-bottom: 14px; }
    .label { color: var(--vscode-descriptionForeground); font-size: 12px; margin-bottom: 6px; }
    .value { font-size: 24px; font-weight: 700; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin: 18px 0; }
    a.button { border: 1px solid var(--vscode-button-border, transparent); border-radius: 4px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); padding: 6px 10px; text-decoration: none; }
    a.button.secondary { color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); }
    .pill { display: inline-flex; border-radius: 999px; padding: 3px 8px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); margin: 0 5px 5px 0; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; border-bottom: 1px solid var(--vscode-panel-border); padding: 8px 6px; vertical-align: top; }
    th { color: var(--vscode-descriptionForeground); }
    pre { white-space: pre-wrap; border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; background: var(--vscode-textCodeBlock-background); overflow: auto; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(report.feature.label)}</h1>
    <p class="muted">${escapeHtml(report.project.label)} · ${escapeHtml(report.feature.rootPath)} · generated ${escapeHtml(report.generatedAt)}</p>
    <div class="actions">
      <a class="button" href="${runFeatureHref(report.feature.id)}">Run Targeted Tests</a>
      <a class="button secondary" href="command:testInspector.exportFeatureInvestigation">Export Feature Report</a>
    </div>
    <div class="grid">
      ${card('Risk', report.feature.riskScore)}
      ${card('Coverage', report.feature.averageCoverage === undefined ? 'unknown' : `${report.feature.averageCoverage}%`)}
      ${card('Source Files', report.feature.sourceFiles.length)}
      ${card('Test Files', report.feature.testFiles.length)}
      ${card('Findings', report.weakFindings.length + report.risks.length)}
    </div>
    <section>
      <h2>Signals</h2>
      <p>${report.feature.signals.map((signal) => `<span class="pill">${escapeHtml(signal)}</span>`).join('') || '<span class="muted">No signals detected.</span>'}</p>
    </section>
    <section>
      <h2>Targeted Command</h2>
      <pre>${escapeHtml(report.feature.recommendedCommand ?? 'No targeted test command found.')}</pre>
    </section>
    <section>
      <h2>Top Risky Files</h2>
      ${riskTable(report)}
    </section>
    <section>
      <h2>Suggested Feature Tests</h2>
      <ul>${report.suggestedTests.map((suggestion) => `<li><strong>${escapeHtml(suggestion.title)}</strong>: ${escapeHtml(suggestion.reason)}</li>`).join('')}</ul>
    </section>
    <section>
      <h2>LLM Feature Investigator</h2>
      ${
        report.llmEnabled
          ? `<pre>${escapeHtml(report.llmSummary || 'LLM returned no content.')}</pre>`
          : '<p class="muted">LLM was not used. Configure it and rerun analysis for semantic feature review.</p>'
      }
    </section>
  </main>
</body>
</html>`;
}

function riskTable(report: FeatureInvestigationReport): string {
  if (!report.risks.length) {
    return '<p class="muted">No risky files detected in this feature.</p>';
  }
  return `<table><thead><tr><th>File</th><th>Risk</th><th>Coverage</th><th>Recommendation</th></tr></thead><tbody>${report.risks
    .map(
      (risk) =>
        `<tr><td>${escapeHtml(risk.path)}</td><td>${risk.score}</td><td>${
          risk.coverage?.linesPct === undefined ? 'unknown' : `${risk.coverage.linesPct}%`
        }</td><td>${escapeHtml(risk.recommendation)}</td></tr>`
    )
    .join('')}</tbody></table>`;
}

function card(label: string, value: string | number): string {
  return `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(String(value))}</div></div>`;
}

function runFeatureHref(featureId: string): string {
  return `command:testInspector.runFeatureTests?${encodeURIComponent(JSON.stringify([featureId]))}`;
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
