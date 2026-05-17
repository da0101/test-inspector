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
  const coveragePct = averageCoverage(state.bundle.coverage?.map((summary) => summary.totals.linesPct));
  const coverageLabel = coveragePct === undefined ? 'unknown' : `${coveragePct}%`;
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
    .metric--wide { grid-column: 1 / -1; }
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
      background: var(--vscode-input-background);
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
    .segmented button + button { border-left: 1px solid var(--border); }
    .segmented button.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      font-weight: 600;
      box-shadow: inset 0 0 0 1px var(--vscode-focusBorder);
    }
    .segmented button:focus-visible {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -2px;
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
    .secondary {
      width: 100%;
      margin-top: 6px;
      padding: 6px 10px;
      border-radius: var(--radius);
      border: 1px solid var(--vscode-button-border, var(--border));
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      font: inherit;
      cursor: pointer;
    }
    .secondary:hover { background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground)); }
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
    <div class="metric metric--wide"><strong>${escapeHtml(coverageLabel)}</strong><span>line coverage</span></div>
  </div>
  ${scope ? `<div class="scope" title="${escapeHtml(scope)}">${escapeHtml(scope)}</div>` : ''}
  ${hasCases ? `
    <div class="section-label">Mode</div>
    <div class="segmented" role="group" aria-label="Report mode">
      <button type="button" data-mode="deterministic" class="active" aria-pressed="true">Deterministic</button>
      <button type="button" data-mode="ai" aria-pressed="false">AI</button>
    </div>
    <div class="section-label">Groups</div>
    <form id="form">
      ${groups}
      <button id="generate" class="primary" type="submit">Generate Report</button>
    </form>
    <button id="coverage" class="secondary" type="button">Generate Coverage</button>
    ${status}
  ` : `<div class="empty">Scan a target to enable reports.</div>`}
  <script nonce="${opts.nonce}">
    const vscode = acquireVsCodeApi();
    let mode = 'deterministic';
    const generate = document.getElementById('generate');
    document.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        mode = button.dataset.mode;
        document.querySelectorAll('[data-mode]').forEach((item) => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        if (generate) generate.textContent = mode === 'ai' ? 'Generate AI Report' : 'Generate Report';
      });
    });
    document.getElementById('form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const verdicts = Array.from(document.querySelectorAll('input[name="verdict"]:checked')).map((input) => input.value);
      vscode.postMessage({ type: 'generate', mode, verdicts });
    });
    document.getElementById('coverage')?.addEventListener('click', () => {
      vscode.postMessage({ type: 'coverage' });
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

function averageCoverage(values: Array<number | undefined> | undefined): number | undefined {
  const present = (values ?? []).filter((value): value is number => typeof value === 'number');
  if (present.length === 0) return undefined;
  return Math.round((present.reduce((sum, value) => sum + value, 0) / present.length) * 10) / 10;
}
