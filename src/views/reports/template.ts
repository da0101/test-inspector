import type { CaseFileBundle, CaseVerdict } from '../../services/caseFile';
import type { CaseFileReportMode } from '../../services/exportMarkdown';

export type ReportsState = {
  bundle: CaseFileBundle;
  status?: { kind: 'idle' | 'working' | 'ok' | 'error'; message: string };
};

const VERDICTS: CaseVerdict[] = ['THEATER', 'WEAK', 'MISSING', 'STRONG'];
const LABEL: Record<CaseVerdict, string> = {
  THEATER: 'Theater',
  WEAK: 'Weak',
  MISSING: 'Missing',
  STRONG: 'Strong',
  OK: 'OK',
};

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

export function renderReportsHtml(state: ReportsState, opts: { nonce: string; cspSource: string }): string {
  const hasCases = state.bundle.cases.length > 0;
  const groups = VERDICTS
    .filter((verdict) => (state.bundle.totals[verdict] ?? 0) > 0)
    .map((verdict) => {
      const checked = verdict === 'THEATER' || verdict === 'WEAK' || verdict === 'MISSING';
      return `<label class="check-row">
        <input type="checkbox" name="verdict" value="${verdict}" ${checked ? 'checked' : ''} />
        <span>${LABEL[verdict]}</span>
        <span class="count">${state.bundle.totals[verdict] ?? 0}</span>
      </label>`;
    })
    .join('');
  const status = state.status
    ? `<div class="status ${state.status.kind}">${escapeHtml(state.status.message)}</div>`
    : '';
  const scope = [
    state.bundle.scope?.repoName,
    state.bundle.scope?.branch,
    state.bundle.scope?.featureLabel,
  ].filter(Boolean).join(' · ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; script-src 'nonce-${opts.nonce}';" />
  <title>Reports</title>
  <style>
    :root {
      --type-xs: 11px;
      --type-sm: 12px;
      --type-base: 13px;
      --space-2: 8px;
      --space-3: 12px;
      --radius: 4px;
      --muted: var(--vscode-descriptionForeground);
      --border: var(--vscode-panel-border);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: var(--space-3);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background, transparent);
      font: var(--type-base) var(--vscode-font-family);
      line-height: 1.4;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
      margin-bottom: var(--space-3);
    }
    .metric {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 7px 8px;
      min-width: 0;
    }
    .metric strong {
      display: block;
      font-size: 18px;
      line-height: 1;
      margin-bottom: 3px;
    }
    .metric span, .scope, .empty {
      color: var(--muted);
      font-size: var(--type-xs);
    }
    .scope {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin: -2px 0 var(--space-3);
    }
    .section-label {
      margin: var(--space-3) 0 5px;
      color: var(--muted);
      font-size: var(--type-xs);
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .segmented {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .segmented button {
      border: 0;
      border-radius: 0;
      background: transparent;
      color: var(--vscode-foreground);
      padding: 6px 8px;
      font: inherit;
      cursor: pointer;
    }
    .segmented button.active {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      font-weight: 600;
    }
    .check-row {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr) auto;
      gap: 6px;
      align-items: center;
      padding: 5px 0;
      font-size: var(--type-sm);
      cursor: pointer;
    }
    .check-row input { margin: 0; }
    .count {
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    .primary {
      width: 100%;
      margin-top: var(--space-3);
      padding: 7px 10px;
      border-radius: var(--radius);
      border: 1px solid var(--vscode-button-border, transparent);
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      font: inherit;
      cursor: pointer;
    }
    .primary:hover { background: var(--vscode-button-hoverBackground); }
    .primary[disabled] { opacity: 0.55; cursor: not-allowed; }
    .status {
      margin-top: var(--space-2);
      padding: 6px 8px;
      border-radius: var(--radius);
      font-size: var(--type-xs);
    }
    .status.working { background: rgba(59, 130, 246, 0.12); color: #60a5fa; }
    .status.ok { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
    .status.error { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
  </style>
</head>
<body>
  <div class="summary">
    <div class="metric"><strong>${state.bundle.cases.length}</strong><span>cases</span></div>
    <div class="metric"><strong>${state.bundle.testFiles?.length ?? 0}</strong><span>test files</span></div>
  </div>
  ${scope ? `<div class="scope" title="${escapeHtml(scope)}">${escapeHtml(scope)}</div>` : ''}
  ${hasCases ? `
    <div class="section-label">Mode</div>
    <div class="segmented" role="group" aria-label="Report mode">
      <button type="button" data-mode="deterministic" class="active">Deterministic</button>
      <button type="button" data-mode="ai">AI</button>
    </div>
    <div class="section-label">Groups</div>
    <form id="form">
      ${groups}
      <button id="generate" class="primary" type="submit">Generate Report</button>
    </form>
    ${status}
  ` : `<div class="empty">Scan a target to enable reports.</div>`}
  <script nonce="${opts.nonce}">
    const vscode = acquireVsCodeApi();
    let mode = 'deterministic';
    const generate = document.getElementById('generate');
    document.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        mode = button.dataset.mode;
        document.querySelectorAll('[data-mode]').forEach((item) => item.classList.toggle('active', item === button));
        if (generate) generate.textContent = mode === 'ai' ? 'Generate AI Report' : 'Generate Report';
      });
    });
    document.getElementById('form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const verdicts = Array.from(document.querySelectorAll('input[name="verdict"]:checked')).map((input) => input.value);
      vscode.postMessage({ type: 'generate', mode, verdicts });
    });
    window.addEventListener('message', (event) => {
      if (event.data?.type !== 'progress') return;
      let el = document.querySelector('.status');
      if (!el) {
        el = document.createElement('div');
        el.className = 'status working';
        document.body.appendChild(el);
      }
      el.className = 'status ' + event.data.kind;
      el.textContent = event.data.message;
    });
  </script>
</body>
</html>`;
}
