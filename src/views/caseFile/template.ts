import type { CaseFileBundle } from '../../services/caseFile';
import { VERDICT_ORDER } from './template/constants';
import { projectsById, renderCase, renderKpiTile, renderTab } from './template/render';
import { SCRIPT } from './template/script';
import { STYLE } from './template/style';

export type RenderOptions = {
  nonce: string;
  cspSource: string;
};

export function renderCaseFileHtml(bundle: CaseFileBundle, opts: RenderOptions): string {
  const projectMap = projectsById(bundle.projects);
  const renderedCases = bundle.cases
    .map((c) => renderCase(c, projectMap.get(c.target.projectId)))
    .join('');
  const empty = '<div class="empty">No cases yet. Click Refresh on the Test Inspector sidebar to scan this workspace.</div>';
  const total = bundle.cases.length;

  const kpiTiles = VERDICT_ORDER
    .map((v) => renderKpiTile(v, bundle.totals[v] ?? 0, total))
    .join('');
  const runtimeEvidence = renderRuntimeEvidence(bundle);
  const metricGuide = renderMetricGuide();

  const projectIds = new Set(bundle.cases.map((c) => c.target.projectId));
  const projects = (bundle.projects ?? []).filter((p) => projectIds.has(p.id));
  const tabs = total > 0
    ? `<div class="tabs" role="tablist">
        ${renderTab({ projectId: '*', label: 'All', count: total, active: true })}
        ${projects
          .map((p) => {
            const count = bundle.cases.filter((c) => c.target.projectId === p.id).length;
            return renderTab({ projectId: p.id, label: p.label || p.id, count, framework: p.framework, active: false });
          })
          .join('')}
      </div>`
    : '';

  const hiddenNote = bundle.hiddenReviewedCount && bundle.hiddenReviewedCount > 0
    ? `<span class="hidden-note">· ${bundle.hiddenReviewedCount} hidden (reviewed)</span>`
    : '';
  const subtitle = total > 0
    ? `<span id="counter">${total} case card${total === 1 ? '' : 's'}</span>
       ${hiddenNote}
       <button id="clear-filters" class="clear-link" type="button">Clear filters</button>`
    : `<span id="counter">No cases yet</span>${hiddenNote}`;
  const scope = bundle.scope;
  const scopeLine = scope && (scope.repoName || scope.worktreePath || scope.featureLabel)
    ? `<div class="scope-line">
        ${scope.repoName ? `<span>${escapeInline(scope.repoName)}</span>` : ''}
        ${scope.branch ? `<span>${escapeInline(scope.branch)}</span>` : ''}
        ${scope.featureLabel ? `<span>${escapeInline(scope.featureLabel)}</span>` : ''}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; script-src 'nonce-${opts.nonce}'; img-src ${opts.cspSource};" />
  <title>Test Inspector — Case File</title>
  <style>${STYLE}</style>
</head>
<body>
  <header class="hero">
    <h1 class="hero-title">Test Inspector — Case File</h1>
    <p class="hero-subtitle">${subtitle}</p>
    ${scopeLine}
    ${tabs}
    ${runtimeEvidence}
    ${metricGuide}
    ${total > 0 ? `<div class="kpi-strip">${kpiTiles}</div>` : ''}
  </header>
  <main>
    ${renderedCases || empty}
  </main>
  <script nonce="${opts.nonce}">${SCRIPT}</script>
</body>
</html>`;
}

function renderRuntimeEvidence(bundle: CaseFileBundle): string {
  const testFiles = bundle.testFiles?.length ?? 0;
  const testCases = bundle.runtime?.testCases ?? (bundle.testFiles ?? []).reduce((sum, file) => sum + file.testCases.length, 0);
  const passing = bundle.runtime?.passed !== undefined
    ? `${bundle.runtime.passed}/${testCases} passing`
    : `${testCases} discovered`;
  const lineCoverage = average((bundle.coverage ?? []).map((summary) => summary.totals.linesPct));
  const branchCoverage = average((bundle.coverage ?? []).map((summary) => summary.totals.branchesPct));
  const functionCoverage = average((bundle.coverage ?? []).map((summary) => summary.totals.functionsPct));
  const generated = bundle.runtime?.generatedAt
    ? `<span class="runtime-note" title="${escapeInline(new Date(bundle.runtime.generatedAt).toISOString())}">coverage run passed</span>`
    : lineCoverage !== undefined
      ? `<span class="runtime-note" title="Coverage files were found in this scan. Run Generate Coverage to refresh pass/fail evidence.">coverage file loaded</span>`
      : `<span class="runtime-note" title="No supported coverage file was found yet. Use Reports → Generate Coverage to run the configured coverage command.">coverage unknown until Generate Coverage runs</span>`;
  return `
    <section class="runtime-strip" aria-label="Runtime evidence">
      ${renderRuntimeMetric('Test files', String(testFiles), 'Number of test files Test Inspector discovered and inspected for quality signals.')}
      ${renderRuntimeMetric('Test cases', passing, bundle.runtime?.passed !== undefined
        ? 'Individual test cases reported by the last successful coverage/test run.'
        : 'Individual test cases statically discovered from test declarations. Run Generate Coverage to get pass/fail evidence.')}
      ${renderRuntimeMetric('Lines', formatPct(lineCoverage), 'Percentage of executable source lines hit by unit tests, from the latest supported coverage file.')}
      ${renderRuntimeMetric('Branches', formatPct(branchCoverage), 'Percentage of branches or decision paths hit by unit tests, when the coverage format reports it.')}
      ${renderRuntimeMetric('Functions', formatPct(functionCoverage), 'Percentage of functions hit by unit tests, when the coverage format reports it.')}
      ${generated}
    </section>
  `;
}

function renderMetricGuide(): string {
  return `
    <details class="metric-guide">
      <summary>Metric guide</summary>
      <div class="metric-guide-grid">
        <div><strong>Case cards</strong><span>Actionable findings shown below. One card can represent a test file or a source file.</span></div>
        <div><strong>Test files</strong><span>Actual test files discovered and inspected for quality signals.</span></div>
        <div><strong>Test cases</strong><span>Individual test declarations discovered; after Generate Coverage, passing/total from the successful run.</span></div>
        <div><strong>Lines</strong><span>Executable source lines hit by tests.</span></div>
        <div><strong>Branches</strong><span>Decision paths hit by tests, when reported.</span></div>
        <div><strong>Functions</strong><span>Functions hit by tests, when reported.</span></div>
        <div><strong>Strong test files</strong><span>Test files with no static weak/theater signals; not executed test count.</span></div>
        <div><strong>Missing source files</strong><span>Critical source files with no related test evidence or effectively no coverage.</span></div>
        <div><strong>Theater / Weak</strong><span>Case cards with fake, shallow, fragile, or low-coverage evidence.</span></div>
      </div>
    </details>
  `;
}

function renderRuntimeMetric(label: string, value: string, tooltip: string): string {
  return `
    <span class="runtime-metric" title="${escapeInline(tooltip)}" aria-label="${escapeInline(`${label}: ${value}. ${tooltip}`)}">
      <strong>${escapeInline(value)}</strong>
      <span>${escapeInline(label)}</span>
    </span>
  `;
}

function formatPct(value: number | undefined): string {
  return value === undefined ? 'unknown' : `${value}%`;
}

function average(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => typeof value === 'number');
  if (present.length === 0) return undefined;
  return Math.round((present.reduce((sum, value) => sum + value, 0) / present.length) * 10) / 10;
}

function escapeInline(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
