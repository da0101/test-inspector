import type { CaseFile, CaseFileBundle } from '../../services/caseFile';
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

const VERDICT_COLOR: Record<CaseFile['verdict'], string> = {
  THEATER: '#d33',
  WEAK: '#d80',
  MISSING: '#888',
  STRONG: '#393',
  OK: '#393',
};

function renderCase(c: CaseFile): string {
  const color = VERDICT_COLOR[c.verdict];
  return `
    <article class="case" data-verdict="${escapeHtml(c.verdict)}">
      <header>
        <span class="badge" style="background:${color}">${escapeHtml(c.verdict)}</span>
        <span class="path">${escapeHtml(c.target.path)}</span>
      </header>
      <h3>${escapeHtml(c.story.headline)}</h3>
      <p>${escapeHtml(c.story.paragraph)}</p>
      <footer>
        <button data-cmd="open" data-path="${escapeHtml(c.target.path)}">Open file</button>
        <button data-cmd="evidence">Show evidence</button>
        <button data-cmd="copy" data-text="${escapeHtml(c.suggestion.text)}">Copy suggestion</button>
        <button data-cmd="review" data-path="${escapeHtml(c.target.path)}">Mark as reviewed</button>
      </footer>
    </article>
  `;
}

export type RenderOptions = {
  nonce: string;
  cspSource: string;
};

export function renderCaseFileHtml(bundle: CaseFileBundle, opts: RenderOptions): string {
  const cases = bundle.cases.map(renderCase).join('');
  const empty = '<div class="empty">No cases yet — click Refresh to scan.</div>';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; script-src 'nonce-${opts.nonce}';" />
  <title>Test Inspector — Case File</title>
  <style>
    body { font-family: var(--vscode-font-family); padding: 1rem; max-width: 760px; color: var(--vscode-foreground); }
    h1 { font-size: 1.05rem; margin: 0 0 .5rem; font-weight: 600; }
    .summary { font-size: 0.95rem; color: var(--vscode-descriptionForeground); margin-bottom: 1.5rem; }
    .case { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 1rem; margin-bottom: 1rem; }
    .case header { display: flex; align-items: center; gap: .75rem; margin-bottom: .5rem; }
    .badge { color: white; padding: 2px 8px; border-radius: 3px; font-size: 0.7rem; font-weight: 700; letter-spacing: .04em; }
    .path { font-family: var(--vscode-editor-font-family); font-size: 0.85rem; opacity: .8; }
    .case h3 { font-size: 0.95rem; margin: .25rem 0 .5rem; }
    .case p { font-size: 0.9rem; line-height: 1.5; margin: 0 0 .75rem; }
    .case footer button { background: transparent; border: 1px solid var(--vscode-panel-border); color: var(--vscode-foreground); padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 0.8rem; margin-right: .5rem; }
    .case footer button:hover { background: var(--vscode-list-hoverBackground); }
    .empty { color: var(--vscode-descriptionForeground); font-style: italic; padding: 2rem; text-align: center; }
  </style>
</head>
<body>
  <h1>Test Inspector — Case File</h1>
  <p class="summary">${escapeHtml(summarize(bundle))}</p>
  ${cases || empty}
  <script nonce="${opts.nonce}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('button[data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        vscode.postMessage({
          type: btn.dataset.cmd,
          path: btn.dataset.path,
          text: btn.dataset.text,
        });
      });
    });
  </script>
</body>
</html>`;
}
