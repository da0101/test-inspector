import * as path from 'path';
import * as vscode from 'vscode';
import { ChangedFileRisk, QualityFinding, SetupIssue, TestFile, TestProject } from '../models';
import { InspectorState } from '../services/state';

export class Dashboard {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private readonly state: InspectorState) {}

  show(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      this.refresh();
      return;
    }

    this.panel = vscode.window.createWebviewPanel('testInspector.dashboard', 'Test Inspector', vscode.ViewColumn.One, {
      enableCommandUris: [
        'testInspector.refreshAll',
        'testInspector.generateCoverage',
        'testInspector.runAll',
        'testInspector.runFeatureTests',
        'testInspector.analyzeFeature',
        'testInspector.selectProject',
        'testInspector.clearProjectFilter',
        'testInspector.selectFeature',
        'testInspector.clearFeatureFilter',
        'testInspector.clearNotices',
        'testInspector.exportReport',
        'testInspector.analyzeTopRisk',
        'testInspector.analyzeCurrentFile',
        'testInspector.analyzeFile',
        'testInspector.configureLlm',
        'workbench.action.files.openFolder'
      ],
      enableScripts: true,
      localResourceRoots: [],
      retainContextWhenHidden: true
    });
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
    this.refresh();
  }

  refresh(): void {
    if (!this.panel) {
      return;
    }
    this.panel.webview.html = renderDashboard(this.state);
  }
}

function renderDashboard(state: InspectorState): string {
  const visible = visibleState(state);
  const testCases = visible.testFiles.flatMap((file) => file.testCases);
  const findings = visible.testFiles.flatMap((file) => file.qualityFindings);
  const coveragePct = average(visible.coverage.map((summary) => summary.totals.linesPct));
  const failing = testCases.filter((testCase) => testCase.status === 'failed').length;
  const skipped = testCases.filter((testCase) => testCase.status === 'skipped').length;
  const riskCount = visible.changedFiles.filter((risk) => risk.findings.length > 0).length;
  const untestedCount = visible.sourceRisks.filter((risk) => risk.relatedTests.length === 0).length;
  const lowCoverageCount = visible.sourceRisks.filter((risk) => risk.coverage?.linesPct !== undefined && risk.coverage.linesPct < 50).length;
  const weakTestCount = findings.filter((finding) => ['weak-test', 'orphan-test', 'trivial-assertion', 'no-assertion', 'snapshot-only'].includes(finding.kind)).length;
  const topRisks = visible.sourceRisks.slice(0, 8);
  const selectedProject = state.selectedProjectId ? state.projects.find((project) => project.id === state.selectedProjectId) : undefined;
  const selectedFeature = state.selectedFeatureId ? state.featureAreas.find((area) => area.id === state.selectedFeatureId) : undefined;
  const notices = visibleNotices(state);
  const brief = healthBrief(visible, coveragePct, findings, weakTestCount);
  const nonce = makeNonce();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Inspector</title>
  <style nonce="${nonce}">
    :root {
      color-scheme: dark;
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --muted: var(--vscode-descriptionForeground);
      --border: var(--vscode-panel-border);
      --accent: var(--vscode-charts-blue);
      --ok: var(--vscode-testing-iconPassed);
      --warn: var(--vscode-testing-iconSkipped);
      --bad: var(--vscode-testing-iconFailed);
    }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    main {
      max-width: 1320px;
      padding: 28px 32px 40px;
    }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 22px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 15px;
      font-weight: 650;
      letter-spacing: 0;
    }
    p {
      margin: 0;
      color: var(--muted);
    }
    .toolbar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: flex-start;
    }
    .menu {
      position: relative;
    }
    .menu summary {
      list-style: none;
      cursor: pointer;
      border: 1px solid var(--vscode-button-secondaryBorder, var(--border));
      border-radius: 4px;
      color: var(--vscode-button-secondaryForeground);
      background: var(--vscode-button-secondaryBackground);
      padding: 6px 10px;
      white-space: nowrap;
      user-select: none;
    }
    .menu summary::-webkit-details-marker {
      display: none;
    }
    .menu summary::after {
      content: "v";
      margin-left: 7px;
      color: var(--muted);
    }
    .menu[open] summary {
      border-color: var(--vscode-focusBorder);
    }
    .menu-panel {
      position: absolute;
      right: 0;
      top: calc(100% + 6px);
      z-index: 10;
      display: grid;
      gap: 4px;
      min-width: 190px;
      padding: 6px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--vscode-editorWidget-background);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
    }
    .menu-panel .button {
      display: block;
      text-align: left;
      background: transparent;
      border-color: transparent;
      color: var(--fg);
    }
    .menu-panel .button:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .project-switcher {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
      margin: 0 0 18px;
      padding: 8px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--vscode-sideBar-background);
    }
    .switch-label {
      color: var(--muted);
      font-size: 12px;
      margin-right: 4px;
    }
    a.button {
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 4px;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      padding: 6px 10px;
      text-decoration: none;
      white-space: nowrap;
    }
    a.button.secondary {
      color: var(--vscode-button-secondaryForeground);
      background: var(--vscode-button-secondaryBackground);
    }
    a.switch {
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--fg);
      background: var(--vscode-editorWidget-background);
      padding: 4px 9px;
      text-decoration: none;
      white-space: nowrap;
      font-size: 12px;
    }
    a.switch.active {
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      border-color: var(--vscode-focusBorder);
    }
    .button.inline {
      display: inline-flex;
      margin-top: 8px;
      font-size: 12px;
      padding: 4px 8px;
    }
    .notices {
      border-color: var(--vscode-notifications-border, var(--border));
    }
    .notices-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 8px;
    }
    .notice-list {
      display: grid;
      gap: 8px;
    }
    .notice {
      border-left: 3px solid var(--warn);
      padding: 9px 10px;
      background: var(--vscode-editorWidget-background);
      border-radius: 4px;
    }
    .notice.error {
      border-left-color: var(--bad);
    }
    .notice.info {
      border-left-color: var(--accent);
    }
    .setup {
      border-left: 4px solid var(--accent);
    }
    .setup-intro {
      margin-bottom: 10px;
    }
    .setup-list {
      display: grid;
      gap: 8px;
    }
    .setup-item {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px;
      background: var(--vscode-editorWidget-background);
    }
    .setup-item.warning {
      border-left: 3px solid var(--warn);
    }
    .setup-item.error {
      border-left: 3px solid var(--bad);
    }
    .setup-title {
      font-weight: 650;
      margin-bottom: 4px;
    }
    .setup-action {
      margin-top: 6px;
      color: var(--fg);
    }
    .notice-title {
      font-weight: 650;
      margin-bottom: 3px;
    }
    .brief {
      border-left: 4px solid var(--warn);
    }
    .brief.ok {
      border-left-color: var(--ok);
    }
    .brief.bad {
      border-left-color: var(--bad);
    }
    .brief-title {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }
    .brief-title strong {
      font-size: 18px;
    }
    .brief-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
    }
    .brief-card {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px;
      background: var(--vscode-editorWidget-background);
    }
    .brief-card h3 {
      margin: 0 0 7px;
      font-size: 12px;
      color: var(--muted);
      font-weight: 650;
    }
    .brief-card p {
      line-height: 1.35;
    }
    .next-list {
      margin: 0;
      padding-left: 18px;
      color: var(--fg);
    }
    .next-list li {
      margin: 0 0 5px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(120px, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }
    .kpi, section {
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--vscode-sideBar-background);
    }
    .kpi {
      padding: 12px;
    }
    .kpi .label {
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 8px;
    }
    .kpi .value {
      font-size: 26px;
      font-weight: 700;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
      gap: 14px;
    }
    section {
      padding: 14px;
      margin-bottom: 14px;
    }
    .bar {
      height: 10px;
      background: var(--vscode-editorWidget-background);
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .bar span {
      display: block;
      height: 100%;
      width: ${coveragePct ?? 0}%;
      background: ${coverageColor(coveragePct)};
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      border-bottom: 1px solid var(--border);
      padding: 8px 6px;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-weight: 600;
      font-size: 12px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 2px 7px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-size: 12px;
    }
    .muted {
      color: var(--muted);
    }
    .top-gap {
      margin-top: 8px;
    }
    .ok { color: var(--ok); }
    .warn { color: var(--warn); }
    .bad { color: var(--bad); }
    .risk-list {
      display: grid;
      gap: 8px;
    }
    .risk-item {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px;
      background: var(--vscode-editorWidget-background);
    }
    .risk-top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 6px;
    }
    .score {
      font-weight: 700;
      color: var(--bad);
    }
    .signals {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin: 7px 0;
    }
    @media (max-width: 880px) {
      main { padding: 20px; }
      header, .layout { display: block; }
      .toolbar { justify-content: flex-start; margin-top: 14px; }
      .menu-panel { left: 0; right: auto; }
      .grid { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
      .brief-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Test Inspector</h1>
        <p>${workspaceLabel()} · ${scopeLabel(state, selectedProject, selectedFeature)}</p>
      </div>
      ${actionToolbar(selectedProject, selectedFeature)}
    </header>
    ${projectSwitcher(state)}
    ${featureSwitcher(state)}
    ${noticesPanel(notices)}
    ${setupPanel(visible.setupIssues)}
    ${briefPanel(brief)}

    <div class="grid">
      ${kpi('Projects', visible.projects.length)}
      ${kpi('Test Files', visible.testFiles.length)}
      ${kpi('Test Cases', testCases.length)}
      ${kpi('Findings', findings.length, findings.length ? 'warn' : 'ok')}
      ${kpi('Weak Tests', weakTestCount, weakTestCount ? 'warn' : 'ok')}
      ${kpi('Untested Files', untestedCount, untestedCount ? 'bad' : 'ok')}
    </div>

    <div class="layout">
      <div>
        <section>
          <h2>Investigation Priorities</h2>
          ${priorityList(topRisks)}
        </section>
        <section>
          <h2>Feature Areas</h2>
          ${featureTable(state, visible)}
        </section>
        <section>
          <h2>Coverage</h2>
          <div class="bar"><span></span></div>
          <p class="top-gap">${
            coveragePct === undefined
              ? 'No coverage file found yet. Click Generate Coverage to run the project coverage command, then this dashboard will update.'
              : `${coveragePct}% average line coverage · ${lowCoverageCount} low-coverage source files`
          }</p>
        </section>
        <section>
          <h2>Source Files Needing Better Tests</h2>
          ${sourceRiskTable(visible)}
        </section>
        <section>
          <h2>Projects</h2>
          ${projectsTable(state, visible.projects)}
        </section>
        <section>
          <h2>Changed Files Risk</h2>
          ${changedTable(visible.changedFiles, riskCount)}
        </section>
      </div>
      <div>
        <section>
          <h2>Test Status</h2>
          ${statusRows(testCases.length, failing, skipped)}
        </section>
        <section>
          <h2>Quality Findings</h2>
          ${findingsList(findings)}
        </section>
        <section>
          <h2>What This Means</h2>
          <p>${summaryText(coveragePct, visible.sourceRisks.length, weakTestCount)}</p>
        </section>
      </div>
    </div>
  </main>
  <script nonce="${nonce}">
    const menus = Array.from(document.querySelectorAll('details.menu'));
    for (const menu of menus) {
      menu.addEventListener('toggle', () => {
        if (!menu.open) {
          return;
        }
        for (const other of menus) {
          if (other !== menu) {
            other.open = false;
          }
        }
      });
    }
    document.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('details.menu')) {
        return;
      }
      for (const menu of menus) {
        menu.open = false;
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }
      for (const menu of menus) {
        menu.open = false;
      }
    });
  </script>
</body>
</html>`;
}

function actionToolbar(selectedProject: TestProject | undefined, selectedFeature: InspectorState['featureAreas'][number] | undefined): string {
  const scopeLabel = selectedFeature ? `Feature: ${selectedFeature.label}` : selectedProject ? `Project: ${selectedProject.label}` : 'Scope';
  return `<div class="toolbar">
    <a class="button" href="command:testInspector.refreshAll">Refresh</a>
    <details class="menu">
      <summary>${escapeHtml(scopeLabel)}</summary>
      <div class="menu-panel">
        <a class="button" href="command:testInspector.selectProject">Select Project</a>
        <a class="button" href="command:testInspector.selectFeature">Select Feature</a>
        ${selectedProject ? '<a class="button" href="command:testInspector.clearProjectFilter">Clear Project Filter</a>' : ''}
        ${selectedFeature ? '<a class="button" href="command:testInspector.clearFeatureFilter">Clear Feature Filter</a>' : ''}
      </div>
    </details>
    <details class="menu">
      <summary>Analyze</summary>
      <div class="menu-panel">
        <a class="button" href="command:testInspector.analyzeTopRisk">Top Risk</a>
        <a class="button" href="command:testInspector.analyzeCurrentFile">Current File</a>
        <a class="button" href="command:testInspector.analyzeFeature">Selected Feature</a>
      </div>
    </details>
    <details class="menu">
      <summary>Run</summary>
      <div class="menu-panel">
        <a class="button" href="command:testInspector.runFeatureTests">Feature Tests</a>
        <a class="button" href="command:testInspector.runAll">All Tests</a>
        <a class="button" href="command:testInspector.generateCoverage">Coverage</a>
      </div>
    </details>
    <details class="menu">
      <summary>More</summary>
      <div class="menu-panel">
        <a class="button" href="command:workbench.action.files.openFolder">Open Folder</a>
        <a class="button" href="command:testInspector.configureLlm">Configure LLM</a>
        <a class="button" href="command:testInspector.exportReport">Export Report</a>
      </div>
    </details>
  </div>`;
}

function visibleNotices(state: InspectorState) {
  return state.notices.filter((notice) => !state.selectedProjectId || !notice.projectId || notice.projectId === state.selectedProjectId).slice(0, 5);
}

function noticesPanel(notices: ReturnType<typeof visibleNotices>): string {
  if (!notices.length) {
    return '';
  }
  return `<section class="notices">
    <div class="notices-head">
      <h2>Needs Attention</h2>
      <a href="command:testInspector.clearNotices">Clear</a>
    </div>
    <div class="notice-list">${notices
      .map(
        (notice) => `<div class="notice ${notice.severity}">
          <div class="notice-title">${escapeHtml(notice.message)}</div>
          ${notice.detail ? `<div class="muted">${escapeHtml(notice.detail)}</div>` : ''}
          <div class="muted">${formatNoticeTime(notice.createdAt)}</div>
        </div>`
      )
      .join('')}</div>
  </section>`;
}

function setupPanel(issues: SetupIssue[]): string {
  if (!issues.length) {
    return '';
  }
  return `<section class="setup">
    <h2>Setup Needed</h2>
    <p class="setup-intro">These are configuration blockers, not proof that the app is poorly tested. Fix them so Test Inspector can run tests and read coverage reliably.</p>
    <div class="setup-list">${issues
      .map(
        (issue) => `<div class="setup-item ${issue.severity}">
          <div class="setup-title">${escapeHtml(issue.title)}</div>
          <div class="muted">${escapeHtml(issue.detail)}</div>
          <div class="setup-action">${escapeHtml(issue.action)}</div>
        </div>`
      )
      .join('')}</div>
  </section>`;
}

type HealthBrief = {
  tone: 'ok' | 'warn' | 'bad';
  headline: string;
  plain: string;
  works: string;
  attention: string;
  nextSteps: string[];
};

function healthBrief(
  visible: ReturnType<typeof visibleState>,
  coveragePct: number | undefined,
  findings: QualityFinding[],
  weakTestCount: number
): HealthBrief {
  const testCases = visible.testFiles.flatMap((file) => file.testCases);
  const missingCoverage = coveragePct === undefined;
  const blockingSetup = visible.setupIssues.filter((issue) => issue.severity !== 'info');
  const untested = visible.sourceRisks.filter((risk) => risk.relatedTests.length === 0).length;
  const topFeatures = visible.featureAreas
    .filter((area) => area.riskScore >= 50)
    .slice(0, 3)
    .map((area) => area.label);
  const skipped = findings.filter((finding) => finding.kind === 'skipped-test').length;

  if (!visible.testFiles.length) {
    return {
      tone: blockingSetup.length ? 'warn' : 'bad',
      headline: blockingSetup.length ? 'Project setup is incomplete.' : 'I do not see useful tests yet.',
      plain: 'Test Inspector found app code, but it did not find test files for this scope.',
      works: 'Project detection is working.',
      attention: blockingSetup.length
        ? `${blockingSetup.length} setup item${blockingSetup.length === 1 ? '' : 's'} need to be fixed before this scope is reliable.`
        : 'There is no evidence yet that important behavior is protected by tests.',
      nextSteps: blockingSetup.length
        ? ['Fix the setup items above.', 'Run Refresh again.', 'Then review the test and coverage results.']
        : ['Add or open the project test folder.', 'Run Refresh again.', 'Start with tests for the main user flows.']
    };
  }

  const tone = blockingSetup.length || missingCoverage || untested > 20 ? 'bad' : weakTestCount || findings.length ? 'warn' : 'ok';
  const headline =
    blockingSetup.length
      ? 'Project setup is incomplete, so results are limited.'
      : tone === 'ok'
      ? 'The test setup looks healthy from this scan.'
      : missingCoverage
        ? 'Tests exist, but I cannot prove what the app covers yet.'
        : 'Some important app areas need test attention.';
  const attentionParts = [];
  if (blockingSetup.length) {
    attentionParts.push(`${blockingSetup.length} setup item${blockingSetup.length === 1 ? '' : 's'} need attention`);
  }
  if (missingCoverage) {
    attentionParts.push('coverage is missing');
  }
  if (untested > 0) {
    attentionParts.push(`${untested} app files have no obvious direct test`);
  }
  if (skipped > 0) {
    attentionParts.push(`${skipped} test${skipped === 1 ? ' is' : 's are'} skipped`);
  }
  if (weakTestCount > 0) {
    attentionParts.push(`${weakTestCount} test${weakTestCount === 1 ? ' looks' : 's look'} weak`);
  }

  const nextSteps = [];
  if (blockingSetup.length) {
    nextSteps.push('Fix the setup items above so test and coverage results are not misleading.');
  }
  if (missingCoverage) {
    nextSteps.push('Run coverage so the tool can tell covered vs uncovered code, not just guessed risk.');
  }
  if (topFeatures.length) {
    nextSteps.push(`Review these areas first: ${topFeatures.join(', ')}.`);
  }
  if (visible.sourceRisks.length) {
    nextSteps.push('Click Analyze on the first real app file to get a focused test plan.');
  }
  if (!nextSteps.length) {
    nextSteps.push('Pick a changed feature and run related tests before opening a PR.');
  }

  return {
    tone,
    headline,
    plain: `I found ${visible.testFiles.length} test files with ${testCases.length} named test cases.`,
    works: `${visible.projects.length} project${visible.projects.length === 1 ? '' : 's'} detected. Test discovery is working.`,
    attention: attentionParts.length ? attentionParts.join(', ') + '.' : 'No obvious test-quality problems in this scope.',
    nextSteps
  };
}

function briefPanel(brief: HealthBrief): string {
  return `<section class="brief ${brief.tone}">
    <div class="brief-title">
      <strong>${escapeHtml(brief.headline)}</strong>
      <span class="${brief.tone === 'bad' ? 'bad' : brief.tone === 'warn' ? 'warn' : 'ok'}">${brief.tone === 'ok' ? 'Looks OK' : 'Needs attention'}</span>
    </div>
    <p>${escapeHtml(brief.plain)}</p>
    <div class="brief-grid">
      <div class="brief-card">
        <h3>What works</h3>
        <p>${escapeHtml(brief.works)}</p>
      </div>
      <div class="brief-card">
        <h3>What needs attention</h3>
        <p>${escapeHtml(brief.attention)}</p>
      </div>
      <div class="brief-card">
        <h3>Next steps</h3>
        <ol class="next-list">${brief.nextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
      </div>
    </div>
  </section>`;
}

function formatNoticeTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function projectSwitcher(state: InspectorState): string {
  if (state.projects.length <= 1) {
    return '';
  }
  const allActive = !state.selectedProjectId;
  const items = [
    `<a class="switch ${allActive ? 'active' : ''}" href="command:testInspector.clearProjectFilter">All Projects</a>`,
    ...state.projects.map((project) => {
      const active = state.selectedProjectId === project.id;
      return `<a class="switch ${active ? 'active' : ''}" href="${selectProjectHref(project.id)}">${escapeHtml(project.workspacePath ?? project.label)}</a>`;
    })
  ];
  return `<div class="project-switcher"><span class="switch-label">Project</span>${items.join('')}</div>`;
}

function selectProjectHref(projectId: string): string {
  return `command:testInspector.selectProject?${encodeURIComponent(JSON.stringify([projectId]))}`;
}

function featureSwitcher(state: InspectorState): string {
  const features = state.featureAreas.filter((area) => !state.selectedProjectId || area.projectId === state.selectedProjectId).slice(0, 16);
  if (!features.length) {
    return '';
  }
  const allActive = !state.selectedFeatureId;
  const items = [
    `<a class="switch ${allActive ? 'active' : ''}" href="command:testInspector.clearFeatureFilter">All Features</a>`,
    ...features.map((feature) => {
      const active = state.selectedFeatureId === feature.id;
      return `<a class="switch ${active ? 'active' : ''}" href="${selectFeatureHref(feature.id)}">${escapeHtml(feature.label)}</a>`;
    })
  ];
  return `<div class="project-switcher"><span class="switch-label">Feature</span>${items.join('')}</div>`;
}

function selectFeatureHref(featureId: string): string {
  return `command:testInspector.selectFeature?${encodeURIComponent(JSON.stringify([featureId]))}`;
}

function scopeLabel(state: InspectorState, selectedProject?: TestProject, selectedFeature?: InspectorState['featureAreas'][number]): string {
  if (selectedFeature) {
    return `filtered to feature ${escapeHtml(selectedFeature.label)}`;
  }
  if (selectedProject) {
    return `filtered to ${escapeHtml(selectedProject.label)}`;
  }
  return `${state.projects.length} detected project${state.projects.length === 1 ? '' : 's'}`;
}

function visibleState(state: InspectorState) {
  const selected = state.selectedProjectId;
  if (!selected) {
    const feature = state.selectedFeatureId ? state.featureAreas.find((area) => area.id === state.selectedFeatureId) : undefined;
    if (feature) {
      return filterToFeature(state, feature, state.projects);
    }
    return {
      projects: state.projects,
      testFiles: state.testFiles,
      coverage: state.coverage,
      setupIssues: state.setupIssues,
      changedFiles: state.changedFiles,
      sourceRisks: state.sourceRisks,
      featureAreas: state.featureAreas
    };
  }
  const projectScoped = {
    projects: state.projects.filter((project) => project.id === selected),
    testFiles: state.testFiles.filter((testFile) => testFile.projectId === selected),
    coverage: state.coverage.filter((summary) => summary.projectId === selected),
    setupIssues: state.setupIssues.filter((issue) => issue.projectId === selected),
    changedFiles: state.changedFiles.filter((risk) => risk.projectId === selected),
    sourceRisks: state.sourceRisks.filter((risk) => risk.projectId === selected),
    featureAreas: state.featureAreas.filter((area) => area.projectId === selected)
  };
  const feature = state.selectedFeatureId ? projectScoped.featureAreas.find((area) => area.id === state.selectedFeatureId) : undefined;
  return feature ? filterToFeature(state, feature, projectScoped.projects) : projectScoped;
}

function filterToFeature(state: InspectorState, feature: InspectorState['featureAreas'][number], projects: InspectorState['projects']) {
  const sourceSet = new Set(feature.sourceFiles);
  const testSet = new Set(feature.testFiles);
  return {
    projects: projects.filter((project) => project.id === feature.projectId),
    testFiles: state.testFiles.filter((testFile) => testSet.has(testFile.path)),
    coverage: state.coverage.filter((summary) => summary.projectId === feature.projectId),
    setupIssues: state.setupIssues.filter((issue) => issue.projectId === feature.projectId),
    changedFiles: state.changedFiles.filter((risk) => risk.projectId === feature.projectId && sourceSet.has(risk.path)),
    sourceRisks: state.sourceRisks.filter((risk) => risk.projectId === feature.projectId && sourceSet.has(risk.path)),
    featureAreas: [feature]
  };
}

function priorityList(risks: InspectorState['sourceRisks']): string {
  if (!risks.length) {
    return '<p class="ok">I do not see a high-priority testing gap in this scope.</p>';
  }
  return `<div class="risk-list">${risks
    .map(
      (risk) => `<div class="risk-item">
        <div class="risk-top">
          <strong>${escapeHtml(shortPath(risk.path))}</strong>
          <span class="score">${risk.score >= 80 ? 'High attention' : 'Review'}</span>
        </div>
        <div>${escapeHtml(riskProblem(risk))}</div>
        <div class="muted top-gap">${escapeHtml(riskWhy(risk))}</div>
        <div class="signals">${risk.signals.slice(0, 4).map((signal) => `<span class="pill">${escapeHtml(signal)}</span>`).join('')}</div>
        <div class="muted">${escapeHtml(riskNext(risk))}</div>
        <a class="button secondary inline" href="${analyzeHref(risk.path)}">Explain this file</a>
      </div>`
    )
    .join('')}</div>`;
}

function featureTable(state: InspectorState, visible: ReturnType<typeof visibleState>): string {
  if (!visible.featureAreas.length) {
    return '<p class="muted">No feature areas detected yet. Refresh All after opening a project with feature/module folders.</p>';
  }
  return `<table><thead><tr><th>Feature</th><th>Project</th><th>Risk</th><th>Source</th><th>Tests</th><th>Coverage</th><th>Action</th></tr></thead><tbody>${visible.featureAreas
    .slice(0, 12)
    .map(
      (area) =>
        `<tr><td>${escapeHtml(area.label)}</td><td>${escapeHtml(projectLabel(state, area.projectId))}</td><td class="${area.riskScore >= 70 ? 'bad' : area.riskScore >= 40 ? 'warn' : 'ok'}">${
          area.riskScore
        }</td><td>${area.sourceFiles.length}</td><td>${area.testFiles.length}</td><td>${
          area.averageCoverage === undefined ? 'unknown' : `${area.averageCoverage}%`
        }</td><td><a href="${analyzeFeatureHref(area.id)}">Analyze</a> · <a href="${runFeatureHref(area.id)}">Run</a></td></tr>`
    )
    .join('')}</tbody></table>`;
}

function projectLabel(state: InspectorState, projectId: string): string {
  return state.projects.find((project) => project.id === projectId)?.framework ?? projectId;
}

function analyzeFeatureHref(featureId: string): string {
  return `command:testInspector.analyzeFeature?${encodeURIComponent(JSON.stringify([featureId]))}`;
}

function runFeatureHref(featureId: string): string {
  return `command:testInspector.runFeatureTests?${encodeURIComponent(JSON.stringify([featureId]))}`;
}

function analyzeHref(filePath: string): string {
  return `command:testInspector.analyzeFile?${encodeURIComponent(JSON.stringify([filePath]))}`;
}

function kpi(label: string, value: number | string, tone = ''): string {
  return `<div class="kpi"><div class="label">${escapeHtml(label)}</div><div class="value ${tone}">${escapeHtml(String(value))}</div></div>`;
}

function projectsTable(state: InspectorState, projects: TestProject[]): string {
  if (!projects.length) {
    return '<p>No supported test projects detected. Open a repo root, then run Refresh All.</p>';
  }
  return `<table><thead><tr><th>Project</th><th>Path</th><th>Framework</th><th>Test</th><th>Coverage</th></tr></thead><tbody>${projects
    .map(
      (project) =>
        `<tr><td>${escapeHtml(project.label)}${state.selectedProjectId === project.id ? ' <span class="pill">active</span>' : ''}</td><td class="muted">${escapeHtml(
          project.workspacePath ?? shortPath(project.rootPath)
        )}</td><td><span class="pill">${escapeHtml(project.framework)}</span></td><td class="muted">${escapeHtml(
          project.testCommand ?? 'not detected'
        )}</td><td class="muted">${escapeHtml(project.coverageCommand ?? 'not detected')}</td></tr>`
    )
    .join('')}</tbody></table>`;
}

function sourceRiskTable(visible: ReturnType<typeof visibleState>): string {
  if (!visible.sourceRisks.length) {
    return '<p class="ok">I do not see app files that clearly need better tests in this scope.</p>';
  }
  return `<table><thead><tr><th>File</th><th>Problem</th><th>Why it matters</th><th>Next action</th></tr></thead><tbody>${visible.sourceRisks
    .slice(0, 16)
    .map(
      (risk) =>
        `<tr><td>${escapeHtml(shortPath(risk.path))}</td><td>${escapeHtml(riskProblem(risk))}</td><td>${escapeHtml(riskWhy(risk))}</td><td>${escapeHtml(
          riskNext(risk)
        )}</td></tr>`
    )
    .join('')}</tbody></table>`;
}

function changedTable(changedFiles: ChangedFileRisk[], riskCount: number): string {
  if (!changedFiles.length) {
    return `<p>No changed source files detected in Git. ${riskCount ? '' : 'Edit a source file or switch to a branch with changes to see PR-style test risk here.'}</p>`;
  }
  return `<table><thead><tr><th>File</th><th>Related Tests</th><th>Coverage</th><th>Findings</th></tr></thead><tbody>${changedFiles
    .map(
      (risk) =>
        `<tr><td>${escapeHtml(shortPath(risk.path))}</td><td>${risk.relatedTests.length}</td><td>${risk.coverage?.linesPct ?? 'unknown'}</td><td>${
          risk.findings.length ? escapeHtml(risk.findings.map((finding) => finding.kind).join(', ')) : '<span class="ok">clear</span>'
        }</td></tr>`
    )
    .join('')}</tbody></table>`;
}

function statusRows(total: number, failing: number, skipped: number): string {
  const unknown = Math.max(total - failing - skipped, 0);
  return `<table><tbody>
    <tr><td>Total discovered</td><td>${total}</td></tr>
    <tr><td>Failing from latest run</td><td class="${failing ? 'bad' : 'ok'}">${failing}</td></tr>
    <tr><td>Skipped from latest run</td><td class="${skipped ? 'warn' : 'ok'}">${skipped}</td></tr>
    <tr><td>Not run yet</td><td>${unknown}</td></tr>
  </tbody></table>`;
}

function findingsList(findings: QualityFinding[]): string {
  if (!findings.length) {
    return '<p class="ok">No quality findings detected.</p>';
  }
  return `<table><tbody>${findings
    .slice(0, 12)
    .map(
      (finding) =>
        `<tr><td><span class="${finding.severity === 'error' ? 'bad' : 'warn'}">${escapeHtml(finding.severity)}</span></td><td>${escapeHtml(
          finding.message
        )}<br><span class="muted">${escapeHtml(shortPath(finding.filePath))}${finding.line ? `:${finding.line}` : ''}</span></td></tr>`
    )
    .join('')}</tbody></table>`;
}

function summaryText(coveragePct: number | undefined, sourceRisks: number, weakTests: number): string {
  const parts = [];
  if (coveragePct !== undefined) {
    parts.push(`Coverage says ${coveragePct}% of lines are tested.`);
  } else {
    parts.push('Coverage is unknown, so the tool can only make an educated guess from file names, imports, and test structure.');
  }
  if (sourceRisks > 0) {
    parts.push(`${sourceRisks} app files need a closer look.`);
  }
  if (weakTests > 0) {
    parts.push(`${weakTests} tests may not prove real behavior.`);
  }
  if (!parts.length) {
    return 'Nothing obvious is broken in this scan. For deeper confidence, analyze a feature or changed file.';
  }
  return parts.join(' ');
}

function riskProblem(risk: InspectorState['sourceRisks'][number]): string {
  if (risk.relatedTests.length === 0 && risk.coverage?.linesPct === undefined) {
    return 'No direct test found, and coverage is unknown.';
  }
  if (risk.relatedTests.length === 0) {
    return 'No direct test found for this file.';
  }
  if (risk.coverage?.linesPct !== undefined && risk.coverage.linesPct < 50) {
    return `Coverage is low at ${risk.coverage.linesPct}%.`;
  }
  return 'Existing tests should be reviewed.';
}

function riskWhy(risk: InspectorState['sourceRisks'][number]): string {
  const humanSignals = risk.signals.slice(0, 2);
  if (humanSignals.length) {
    return `This looks like ${humanSignals.join(' and ')}, so bugs here can affect real user behavior.`;
  }
  return 'This file is part of app code and is not clearly protected by tests.';
}

function riskNext(risk: InspectorState['sourceRisks'][number]): string {
  if (risk.relatedTests.length === 0) {
    return 'Add one focused behavior test for the main success path, then add one edge-case test.';
  }
  if (risk.coverage?.linesPct !== undefined && risk.coverage.linesPct < 50) {
    return 'Add tests for the branches and error paths that are currently uncovered.';
  }
  return 'Open the related tests and check that they assert user-visible behavior, not just that code renders.';
}

function coverageColor(value: number | undefined): string {
  if (value === undefined) {
    return 'var(--muted)';
  }
  if (value < 50) {
    return 'var(--bad)';
  }
  if (value < 80) {
    return 'var(--warn)';
  }
  return 'var(--ok)';
}

function average(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => typeof value === 'number');
  if (!present.length) {
    return undefined;
  }
  return Math.round((present.reduce((sum, value) => sum + value, 0) / present.length) * 10) / 10;
}

function shortPath(filePath: string): string {
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  return workspace && filePath.startsWith(workspace) ? path.relative(workspace, filePath) : filePath;
}

function workspaceLabel(): string {
  const workspace = vscode.workspace.workspaceFolders?.[0];
  return workspace ? workspace.name : 'No folder open';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function makeNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 24; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
