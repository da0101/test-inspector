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
    ? `<span id="counter">${total} case${total === 1 ? '' : 's'}</span>
       ${hiddenNote}
       <button id="clear-filters" class="clear-link" type="button">Clear filters</button>`
    : `<span id="counter">No cases yet</span>${hiddenNote}`;

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
    ${tabs}
    ${total > 0 ? `<div class="kpi-strip">${kpiTiles}</div>` : ''}
  </header>
  <main>
    ${renderedCases || empty}
  </main>
  <script nonce="${opts.nonce}">${SCRIPT}</script>
</body>
</html>`;
}
