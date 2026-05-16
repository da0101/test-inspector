import * as path from 'node:path';
import type { TestProject } from '../../models';
import type { CaseFile, CaseFileBundle, CaseVerdict } from '../../services/caseFile';
import { summarize } from '../../services/caseFile';

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

function renderCase(c: CaseFile, project: TestProject | undefined): string {
  const rel = relativePath(c.target.path, project);
  const projectLabel = project ? project.label || project.id : c.target.projectId;
  const projectFramework = project?.framework ?? '';
  return `
    <article class="case" data-verdict="${escapeHtml(c.verdict)}" data-project="${escapeHtml(c.target.projectId)}">
      <header>
        <span class="badge">${escapeHtml(VERDICT_LABEL[c.verdict])}</span>
        <span class="project-chip" data-framework="${escapeHtml(projectFramework)}">${escapeHtml(projectLabel)}</span>
        <span class="path" title="${escapeHtml(c.target.path)}">${escapeHtml(rel)}</span>
      </header>
      <h3>${escapeHtml(c.story.headline)}</h3>
      <p>${escapeHtml(c.story.paragraph)}</p>
      <footer>
        <button class="primary" data-cmd="open" data-path="${escapeHtml(c.target.path)}">Open file</button>
        <button data-cmd="copy" data-text="${escapeHtml(c.suggestion.text)}">Copy suggestion</button>
        <button data-cmd="evidence">Show evidence</button>
        <button data-cmd="review" data-path="${escapeHtml(c.target.path)}">Mark reviewed</button>
      </footer>
    </article>
  `;
}

function renderFilters(bundle: CaseFileBundle): string {
  const verdictPills = VERDICT_ORDER
    .filter((v) => bundle.totals[v] > 0)
    .map(
      (v) =>
        `<button class="pill verdict" data-verdict="${escapeHtml(v)}">${escapeHtml(VERDICT_LABEL[v])} <em>${bundle.totals[v]}</em></button>`,
    )
    .join('');
  const projectIds = new Set(bundle.cases.map((c) => c.target.projectId));
  const projectPills = (bundle.projects ?? [])
    .filter((p) => projectIds.has(p.id))
    .map((p) => {
      const count = bundle.cases.filter((c) => c.target.projectId === p.id).length;
      return `<button class="pill project" data-project="${escapeHtml(p.id)}" data-framework="${escapeHtml(p.framework)}">${escapeHtml(p.label || p.id)} <em>${count}</em></button>`;
    })
    .join('');
  const allCount = bundle.cases.length;
  return `
    <div class="filters">
      <div class="filter-row">
        <span class="filter-label">Verdict</span>
        <button class="pill verdict active" data-verdict="*">All <em>${allCount}</em></button>
        ${verdictPills}
      </div>
      ${projectPills ? `<div class="filter-row">
        <span class="filter-label">Project</span>
        <button class="pill project active" data-project="*">All <em>${allCount}</em></button>
        ${projectPills}
      </div>` : ''}
    </div>
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
  }

  function bindPills(selector, onPick) {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener('click', () => {
        onPick(btn);
        document.querySelectorAll(selector).forEach((b) => b.classList.toggle('active', b === btn));
        applyFilter();
      });
    });
  }
  bindPills('.pill.verdict', (btn) => { verdictFilter = btn.getAttribute('data-verdict'); });
  bindPills('.pill.project', (btn) => { projectFilter = btn.getAttribute('data-project'); });

  document.querySelectorAll('button[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
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
    --case-bg: var(--vscode-editorWidget-background, var(--vscode-editor-background));
    --case-border: var(--vscode-panel-border);
    --muted: var(--vscode-descriptionForeground);

    --verdict-theater: #c0392b;
    --verdict-theater-accent: #e74c3c;
    --verdict-weak: #b9690e;
    --verdict-weak-accent: #ef8c1f;
    --verdict-missing: #4a6572;
    --verdict-missing-accent: #6e8694;
    --verdict-strong: #2e7d32;
    --verdict-strong-accent: #4caf50;
  }

  body {
    font-family: var(--vscode-font-family);
    padding: 0;
    margin: 0;
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    line-height: 1.5;
  }

  .top-bar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--vscode-editor-background);
    border-bottom: 1px solid var(--case-border);
    padding: 1rem 1.5rem 0.85rem;
  }
  .title-row {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  h1 {
    font-size: 1rem;
    margin: 0;
    font-weight: 600;
  }
  .summary {
    color: var(--muted);
    font-size: 0.85rem;
  }
  #counter {
    color: var(--muted);
    font-size: 0.78rem;
    margin-left: auto;
    white-space: nowrap;
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .filter-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .filter-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    min-width: 4rem;
  }
  .pill {
    background: transparent;
    border: 1px solid var(--case-border);
    color: var(--vscode-foreground);
    font-family: inherit;
    font-size: 0.75rem;
    padding: 3px 10px;
    border-radius: 999px;
    cursor: pointer;
  }
  .pill em {
    font-style: normal;
    opacity: 0.55;
    margin-left: 0.3rem;
    font-size: 0.7rem;
  }
  .pill:hover {
    background: var(--vscode-list-hoverBackground);
  }
  .pill.active {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: var(--vscode-button-background);
  }
  .pill.active em {
    opacity: 0.85;
  }

  main {
    padding: 1rem 1.5rem 2rem;
    max-width: 880px;
  }

  .case {
    border: 1px solid var(--case-border);
    border-left: 3px solid var(--case-border);
    border-radius: 5px;
    padding: 0.8rem 1.1rem;
    margin-bottom: 0.65rem;
    background: var(--case-bg);
  }
  .case[data-verdict="THEATER"] { border-left-color: var(--verdict-theater-accent); }
  .case[data-verdict="WEAK"]    { border-left-color: var(--verdict-weak-accent); }
  .case[data-verdict="MISSING"] { border-left-color: var(--verdict-missing-accent); }
  .case[data-verdict="STRONG"]  { border-left-color: var(--verdict-strong-accent); }

  .case header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.45rem;
    flex-wrap: wrap;
  }
  .badge {
    color: white;
    padding: 2px 9px;
    border-radius: 11px;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .case[data-verdict="THEATER"] .badge { background: var(--verdict-theater); }
  .case[data-verdict="WEAK"]    .badge { background: var(--verdict-weak); }
  .case[data-verdict="MISSING"] .badge { background: var(--verdict-missing); }
  .case[data-verdict="STRONG"]  .badge { background: var(--verdict-strong); }

  .project-chip {
    font-size: 0.7rem;
    padding: 1px 7px;
    border-radius: 3px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
  }
  .path {
    font-family: var(--vscode-editor-font-family);
    font-size: 0.78rem;
    color: var(--muted);
    margin-left: auto;
    max-width: 65%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .case h3 {
    font-size: 0.92rem;
    font-weight: 600;
    margin: 0 0 0.4rem;
    line-height: 1.35;
  }
  .case p {
    font-size: 0.85rem;
    line-height: 1.55;
    margin: 0 0 0.75rem;
  }
  .case footer {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .case footer button {
    background: transparent;
    border: 1px solid var(--case-border);
    color: var(--vscode-foreground);
    padding: 3px 11px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.75rem;
    font-family: inherit;
  }
  .case footer button:hover {
    background: var(--vscode-list-hoverBackground);
  }
  .case footer button.primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: var(--vscode-button-background);
  }
  .case footer button.primary:hover {
    background: var(--vscode-button-hoverBackground);
  }

  .empty {
    color: var(--muted);
    font-style: italic;
    padding: 3rem 1.5rem;
    text-align: center;
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
  const empty = '<div class="empty">No cases yet — click Refresh to scan this workspace.</div>';
  const filters = bundle.cases.length > 0 ? renderFilters(bundle) : '';
  const total = bundle.cases.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; script-src 'nonce-${opts.nonce}';" />
  <title>Test Inspector — Case File</title>
  <style>${STYLE}</style>
</head>
<body>
  <div class="top-bar">
    <div class="title-row">
      <h1>Test Inspector — Case File</h1>
      <span class="summary">${escapeHtml(summarize(bundle))}</span>
      <span id="counter">${total} case${total === 1 ? '' : 's'}</span>
    </div>
    ${filters}
  </div>
  <main>
    ${renderedCases || empty}
  </main>
  <script nonce="${opts.nonce}">${SCRIPT}</script>
</body>
</html>`;
}
