import * as path from 'node:path';
import type { TestProject } from '../../models';
import type { CaseFile, CaseFileBundle, CaseVerdict } from '../../services/caseFile';

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);
}

const VERDICT_LABEL: Record<CaseVerdict, string> = {
  THEATER: 'Theater',
  WEAK: 'Weak',
  MISSING: 'Missing',
  STRONG: 'Strong',
  OK: 'OK',
};

const VERDICT_ORDER: CaseVerdict[] = ['THEATER', 'WEAK', 'MISSING', 'STRONG'];

const VERDICT_BLURB: Record<CaseVerdict, string> = {
  THEATER: 'pass without proving anything',
  WEAK: 'one weak signal each',
  MISSING: 'critical code with no tests',
  STRONG: 'doing their job',
  OK: 'no issues',
};

const ICONS: Record<string, string> = {
  THEATER: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  WEAK: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  MISSING: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke-dasharray="3 2"/><path d="M12 8v4"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>`,
  STRONG: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  flutter: `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M14.314 0L2.3 12 6 15.7 21.684.012h-7.357zm.014 11.072L7.857 17.53l6.47 6.47H21.7l-6.46-6.468 6.46-6.46h-7.37z"/></svg>`,
  'firebase-functions': `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M3.89 15.673L6.255.461A.542.542 0 0 1 7.27.288l2.543 4.771zm16.794 3.692l-2.25-14a.54.54 0 0 0-.919-.295L3.316 19.365l7.856 4.427a1.62 1.62 0 0 0 1.588 0zM14.3 7.147l-1.82-3.482a.542.542 0 0 0-.96 0L3.53 17.984z"/></svg>`,
  react: `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="2.05"/><path d="M12 5.5c4.42 0 8 1.34 8 3s-3.58 3-8 3-8-1.34-8-3 3.58-3 8-3zm0 6.5c-1.97 3.84-4.4 6-6 5s-.74-3.66 1.07-7.5C9 5.66 11.4 3.5 13 4.5s.97 3.66-1 7.5z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  vue: `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M0 1.61h6.857L12 9.61l5.143-8h6.857L12 22.39z"/></svg>`,
  django: `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M11.146 0h3.924v18.166c-2.013.382-3.491.535-5.096.535-4.791 0-7.288-2.166-7.288-6.32 0-4.002 2.65-6.6 6.753-6.6.637 0 1.121.05 1.707.203zm0 9.143a3.894 3.894 0 00-1.325-.204c-1.988 0-3.134 1.223-3.134 3.365 0 2.09 1.096 3.236 3.109 3.236.433 0 .79-.026 1.35-.102V9.142z"/></svg>`,
  fastapi: `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M12 0C5.375 0 0 5.375 0 12s5.375 12 12 12 12-5.375 12-12S18.625 0 12 0zm-.624 21.62v-7.528H7.19L13.203 2.38v7.528h4.029Z"/></svg>`,
};

function projectsById(projects: TestProject[] | undefined): Map<string, TestProject> {
  const map = new Map<string, TestProject>();
  for (const p of projects ?? []) map.set(p.id, p);
  return map;
}

function relativePath(absolutePath: string, project: TestProject | undefined): string {
  if (!project) return path.basename(absolutePath);
  const root = project.rootPath.replace(/\/+$/, '');
  const prefix = `${root}/`;
  return absolutePath.startsWith(prefix) ? absolutePath.slice(prefix.length) : path.basename(absolutePath);
}

function frameworkIcon(framework: string | undefined): string {
  return framework && ICONS[framework] ? ICONS[framework] : '';
}

function frameworkLabel(framework: string | undefined): string {
  switch (framework) {
    case 'flutter': return 'Flutter';
    case 'react': return 'React';
    case 'vue': return 'Vue';
    case 'django': return 'Django';
    case 'fastapi': return 'FastAPI';
    case 'firebase-functions': return 'Firebase Functions';
    default: return framework ?? 'Project';
  }
}

function renderKpiTile(verdict: CaseVerdict, count: number, total: number): string {
  const share = total > 0 ? Math.round((count / total) * 100) : 0;
  return `
    <button class="kpi" data-verdict="${escapeHtml(verdict)}" aria-label="Filter to ${VERDICT_LABEL[verdict]} (${count} of ${total} cases)">
      <span class="kpi-icon kpi-icon--${verdict.toLowerCase()}">${ICONS[verdict]}</span>
      <span class="kpi-body">
        <span class="kpi-value">${count}</span>
        <span class="kpi-label">${VERDICT_LABEL[verdict]}</span>
        <span class="kpi-blurb">${VERDICT_BLURB[verdict]}${total > 0 ? ` · ${share}%` : ''}</span>
      </span>
    </button>
  `;
}

function renderProjectPill(project: TestProject, count: number): string {
  const icon = frameworkIcon(project.framework);
  return `
    <button class="pill project" data-project="${escapeHtml(project.id)}">
      ${icon ? `<span class="pill-icon">${icon}</span>` : ''}
      <span>${escapeHtml(project.label || project.id)}</span>
      <em>${count}</em>
    </button>
  `;
}

function renderCase(c: CaseFile, project: TestProject | undefined): string {
  const rel = relativePath(c.target.path, project);
  const projectLabel = project ? project.label || project.id : c.target.projectId;
  const projectFramework = project?.framework;
  const icon = frameworkIcon(projectFramework);
  return `
    <article class="case" data-verdict="${escapeHtml(c.verdict)}" data-project="${escapeHtml(c.target.projectId)}">
      <header>
        <span class="badge badge--${c.verdict.toLowerCase()}" aria-label="${VERDICT_LABEL[c.verdict]} verdict">
          ${ICONS[c.verdict]}
          <span>${escapeHtml(VERDICT_LABEL[c.verdict])}</span>
        </span>
        <span class="project-chip" title="${escapeHtml(frameworkLabel(projectFramework))}">
          ${icon}
          <span>${escapeHtml(projectLabel)}</span>
        </span>
        <span class="path" title="${escapeHtml(c.target.path)}">${escapeHtml(rel)}</span>
      </header>
      <h3>${escapeHtml(c.story.headline)}</h3>
      <p>${escapeHtml(c.story.paragraph)}</p>
      <footer>
        <button class="btn primary" data-cmd="open" data-path="${escapeHtml(c.target.path)}">Open file</button>
        <button class="btn" data-cmd="copy" data-text="${escapeHtml(c.suggestion.text)}">Copy suggestion</button>
        <button class="btn" data-cmd="evidence">Show evidence</button>
        <button class="btn ghost" data-cmd="review" data-path="${escapeHtml(c.target.path)}" aria-label="Mark this case as reviewed">Mark reviewed</button>
      </footer>
    </article>
  `;
}

const SCRIPT = `
  const vscode = acquireVsCodeApi();
  let verdictFilter = '*';
  let projectFilter = '*';

  function applyFilter() {
    let shown = 0;
    document.querySelectorAll('.case').forEach((el) => {
      const v = el.getAttribute('data-verdict');
      const p = el.getAttribute('data-project');
      const match = (verdictFilter === '*' || verdictFilter === v) && (projectFilter === '*' || projectFilter === p);
      el.style.display = match ? '' : 'none';
      if (match) shown++;
    });
    const counter = document.getElementById('counter');
    if (counter) {
      const total = document.querySelectorAll('.case').length;
      counter.textContent = shown === total ? total + ' cases' : 'showing ' + shown + ' of ' + total;
    }
    document.querySelectorAll('.kpi').forEach((tile) => {
      tile.classList.toggle('active', tile.getAttribute('data-verdict') === verdictFilter);
    });
    document.querySelectorAll('.pill.project').forEach((p) => {
      p.classList.toggle('active', p.getAttribute('data-project') === projectFilter);
    });
  }

  document.querySelectorAll('.kpi').forEach((tile) => {
    tile.addEventListener('click', () => {
      const v = tile.getAttribute('data-verdict');
      verdictFilter = (verdictFilter === v) ? '*' : v;
      applyFilter();
    });
  });
  document.querySelectorAll('.pill.project').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-project');
      projectFilter = (projectFilter === p) ? '*' : p;
      applyFilter();
    });
  });
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    verdictFilter = '*';
    projectFilter = '*';
    applyFilter();
  });

  document.querySelectorAll('button[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      vscode.postMessage({
        type: btn.dataset.cmd,
        path: btn.dataset.path,
        text: btn.dataset.text,
      });
    });
  });
`;

const STYLE = `
  :root {
    --type-xs: 11px;
    --type-sm: 12px;
    --type-base: 13px;
    --type-md: 14px;
    --type-lg: 16px;
    --type-xl: 18px;
    --type-2xl: 24px;

    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;

    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-pill: 999px;

    --transition-fast: 150ms cubic-bezier(0.2, 0.0, 0.0, 1.0);
    --transition: 200ms cubic-bezier(0.2, 0.0, 0.0, 1.0);

    --elev-1: 0 1px 2px rgba(0, 0, 0, 0.08);
    --elev-2: 0 2px 4px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
    --elev-3: 0 4px 8px rgba(0, 0, 0, 0.14), 0 2px 4px rgba(0, 0, 0, 0.08);

    --c-theater: #ef4444;
    --c-theater-bg: rgba(239, 68, 68, 0.10);
    --c-theater-border: rgba(239, 68, 68, 0.30);
    --c-weak: #f59e0b;
    --c-weak-bg: rgba(245, 158, 11, 0.10);
    --c-weak-border: rgba(245, 158, 11, 0.30);
    --c-missing: #94a3b8;
    --c-missing-bg: rgba(148, 163, 184, 0.10);
    --c-missing-border: rgba(148, 163, 184, 0.30);
    --c-strong: #22c55e;
    --c-strong-bg: rgba(34, 197, 94, 0.10);
    --c-strong-border: rgba(34, 197, 94, 0.30);

    --surface: var(--vscode-editor-background);
    --surface-elevated: var(--vscode-editorWidget-background, var(--vscode-editor-background));
    --border: var(--vscode-panel-border);
    --muted: var(--vscode-descriptionForeground);
    --fg: var(--vscode-foreground);
  }

  * { box-sizing: border-box; }

  body {
    font-family: var(--vscode-font-family);
    font-size: var(--type-base);
    color: var(--fg);
    background: var(--surface);
    line-height: 1.5;
    margin: 0;
    padding: 0;
  }

  /* Hero */
  .hero {
    padding: var(--space-6) var(--space-6) var(--space-4);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .hero-title {
    font-size: var(--type-xl);
    font-weight: 600;
    margin: 0 0 var(--space-1);
    letter-spacing: -0.005em;
  }
  .hero-subtitle {
    font-size: var(--type-sm);
    color: var(--muted);
    margin: 0 0 var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  #counter {
    font-variant-numeric: tabular-nums;
  }
  .clear-link {
    background: transparent;
    border: none;
    color: var(--vscode-textLink-foreground);
    font-family: inherit;
    font-size: var(--type-sm);
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }
  .clear-link:hover { opacity: 0.85; }

  /* KPI strip */
  .kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  @media (max-width: 720px) {
    .kpi-strip { grid-template-columns: repeat(2, 1fr); }
  }

  .kpi {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--surface-elevated);
    color: var(--fg);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition: background var(--transition), border-color var(--transition), box-shadow var(--transition);
    box-shadow: var(--elev-1);
  }
  .kpi:hover { box-shadow: var(--elev-2); }
  .kpi:focus-visible {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }
  .kpi.active { box-shadow: var(--elev-2); }
  .kpi[data-verdict="THEATER"].active { border-color: var(--c-theater); background: var(--c-theater-bg); }
  .kpi[data-verdict="WEAK"].active    { border-color: var(--c-weak); background: var(--c-weak-bg); }
  .kpi[data-verdict="MISSING"].active { border-color: var(--c-missing); background: var(--c-missing-bg); }
  .kpi[data-verdict="STRONG"].active  { border-color: var(--c-strong); background: var(--c-strong-bg); }

  .kpi-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }
  .kpi-icon--theater { background: var(--c-theater-bg); color: var(--c-theater); }
  .kpi-icon--weak    { background: var(--c-weak-bg); color: var(--c-weak); }
  .kpi-icon--missing { background: var(--c-missing-bg); color: var(--c-missing); }
  .kpi-icon--strong  { background: var(--c-strong-bg); color: var(--c-strong); }

  .kpi-body { display: flex; flex-direction: column; min-width: 0; }
  .kpi-value {
    font-size: var(--type-2xl);
    font-weight: 600;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .kpi-label {
    font-size: var(--type-sm);
    font-weight: 600;
    margin-top: 1px;
  }
  .kpi-blurb {
    font-size: var(--type-xs);
    color: var(--muted);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Project pill row */
  .project-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .project-row-label {
    font-size: var(--type-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-right: var(--space-2);
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: transparent;
    border: 1px solid var(--border);
    color: var(--fg);
    font-family: inherit;
    font-size: var(--type-sm);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }
  .pill .pill-icon { display: inline-flex; opacity: 0.85; }
  .pill em {
    font-style: normal;
    opacity: 0.6;
    margin-left: var(--space-1);
    font-size: var(--type-xs);
  }
  .pill:hover { background: var(--vscode-list-hoverBackground); }
  .pill:focus-visible {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 1px;
  }
  .pill.active {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: var(--vscode-button-background);
  }
  .pill.active em { opacity: 0.9; }

  /* Cases */
  main {
    padding: var(--space-4) var(--space-6) var(--space-8);
    max-width: 920px;
  }

  .case {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-left: 3px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
    margin-bottom: var(--space-3);
    box-shadow: var(--elev-1);
    transition: box-shadow var(--transition), border-color var(--transition-fast);
  }
  .case:hover { box-shadow: var(--elev-2); }
  .case[data-verdict="THEATER"] { border-left-color: var(--c-theater); }
  .case[data-verdict="WEAK"]    { border-left-color: var(--c-weak); }
  .case[data-verdict="MISSING"] { border-left-color: var(--c-missing); }
  .case[data-verdict="STRONG"]  { border-left-color: var(--c-strong); }

  .case header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    flex-wrap: wrap;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 3px 10px 3px 8px;
    border-radius: var(--radius-pill);
    font-size: var(--type-xs);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .badge svg { width: 14px; height: 14px; }
  .badge--theater { background: var(--c-theater-bg); color: var(--c-theater); border: 1px solid var(--c-theater-border); }
  .badge--weak    { background: var(--c-weak-bg); color: var(--c-weak); border: 1px solid var(--c-weak-border); }
  .badge--missing { background: var(--c-missing-bg); color: var(--c-missing); border: 1px solid var(--c-missing-border); }
  .badge--strong  { background: var(--c-strong-bg); color: var(--c-strong); border: 1px solid var(--c-strong-border); }

  .project-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--type-xs);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
  }
  .project-chip svg { opacity: 0.9; }

  .path {
    font-family: var(--vscode-editor-font-family);
    font-size: var(--type-sm);
    color: var(--muted);
    margin-left: auto;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    direction: rtl;
    text-align: left;
  }

  .case h3 {
    font-size: var(--type-lg);
    font-weight: 600;
    margin: 0 0 var(--space-2);
    line-height: 1.35;
    letter-spacing: -0.005em;
  }
  .case p {
    font-size: var(--type-md);
    line-height: 1.55;
    margin: 0 0 var(--space-3);
    color: var(--fg);
  }

  .case footer {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--fg);
    font-family: inherit;
    font-size: var(--type-sm);
    padding: 4px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }
  .btn:hover { background: var(--vscode-list-hoverBackground); }
  .btn:focus-visible {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 1px;
  }
  .btn.primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: var(--vscode-button-background);
  }
  .btn.primary:hover { background: var(--vscode-button-hoverBackground); }
  .btn.ghost {
    border-color: transparent;
    color: var(--muted);
  }
  .btn.ghost:hover {
    background: var(--vscode-list-hoverBackground);
    color: var(--fg);
  }

  .empty {
    color: var(--muted);
    font-style: italic;
    padding: var(--space-8) var(--space-4);
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
`;

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
  const projectPills = (bundle.projects ?? [])
    .filter((p) => projectIds.has(p.id))
    .map((p) => {
      const count = bundle.cases.filter((c) => c.target.projectId === p.id).length;
      return renderProjectPill(p, count);
    })
    .join('');

  const projectRow = projectPills
    ? `<div class="project-row">
        <span class="project-row-label">Project</span>
        ${projectPills}
      </div>`
    : '';

  const subtitle = total > 0
    ? `<span id="counter">${total} case${total === 1 ? '' : 's'}</span>
       <button id="clear-filters" class="clear-link" type="button">Clear filters</button>`
    : `<span id="counter">No cases yet</span>`;

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
    ${total > 0 ? `<div class="kpi-strip">${kpiTiles}</div>` : ''}
    ${projectRow}
  </header>
  <main>
    ${renderedCases || empty}
  </main>
  <script nonce="${opts.nonce}">${SCRIPT}</script>
</body>
</html>`;
}
