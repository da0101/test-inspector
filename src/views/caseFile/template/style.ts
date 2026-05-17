// Webview CSS — single exported string. Treated as data, not code.
// The cap rule on file size targets logic; this is theme/styling.

export const STYLE = `
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

    --transition-fast: 120ms cubic-bezier(0.2, 0.0, 0.0, 1.0);
    --transition: 180ms cubic-bezier(0.2, 0.0, 0.0, 1.0);

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
    --accent: var(--vscode-focusBorder, var(--vscode-button-background));
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }

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
    padding: var(--space-5) var(--space-6) 0;
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
  .scope-line {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: calc(-1 * var(--space-2)) 0 var(--space-4);
    color: var(--muted);
    font-size: var(--type-xs);
  }
  .scope-line span {
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 2px var(--space-2);
    max-width: 360px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  /* Project tabs */
  .tabs {
    display: flex;
    gap: 0;
    margin: 0 0 var(--space-4);
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--muted);
    font-family: inherit;
    font-size: var(--type-md);
    cursor: pointer;
    margin-bottom: -1px;
    transition: color var(--transition-fast), border-color var(--transition-fast);
    white-space: nowrap;
  }
  .tab .tab-icon { display: inline-flex; opacity: 0.85; }
  .tab em {
    font-style: normal;
    opacity: 0.55;
    font-size: var(--type-xs);
    font-variant-numeric: tabular-nums;
  }
  .tab:hover { color: var(--fg); }
  .tab.active {
    color: var(--fg);
    border-bottom-color: var(--accent);
    font-weight: 600;
  }
  .tab.active em { opacity: 0.8; }
  .tab:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  /* Runtime evidence */
  .runtime-strip {
    display: grid;
    grid-template-columns: repeat(5, minmax(88px, 1fr)) minmax(150px, auto);
    gap: var(--space-2);
    align-items: stretch;
    margin: 0 0 var(--space-4);
  }
  @media (max-width: 920px) {
    .runtime-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 560px) {
    .runtime-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  .runtime-metric,
  .runtime-note {
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
    padding: 7px var(--space-3);
  }
  .runtime-metric strong {
    display: block;
    font-size: var(--type-md);
    line-height: 1.1;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .runtime-metric span,
  .runtime-note {
    color: var(--muted);
    font-size: var(--type-xs);
  }
  .runtime-note {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .metric-guide {
    margin: calc(-1 * var(--space-2)) 0 var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
  }
  .metric-guide summary {
    cursor: pointer;
    padding: 6px 10px;
    color: var(--vscode-textLink-foreground);
    font-size: var(--type-xs);
    font-weight: 600;
    user-select: none;
  }
  .metric-guide summary:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .metric-guide-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-2);
    padding: 0 10px 10px;
  }
  .metric-guide-grid div {
    min-width: 0;
  }
  .metric-guide-grid strong,
  .metric-guide-grid span {
    display: block;
  }
  .metric-guide-grid strong {
    font-size: var(--type-xs);
    font-weight: 600;
  }
  .metric-guide-grid span {
    color: var(--muted);
    font-size: var(--type-xs);
    line-height: 1.35;
  }
  @media (max-width: 920px) {
    .metric-guide-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 560px) {
    .metric-guide-grid { grid-template-columns: 1fr; }
  }

  /* KPI strip */
  .kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
    padding-bottom: var(--space-4);
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
    transition: background var(--transition), border-color var(--transition), box-shadow var(--transition), opacity var(--transition);
    box-shadow: var(--elev-1);
  }
  .kpi:hover:not(.disabled) { box-shadow: var(--elev-2); }
  .kpi:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .kpi.disabled {
    opacity: 0.4;
    cursor: default;
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
    display: inline-flex;
    gap: 4px;
  }
  .kpi-blurb-text, .kpi-blurb-sep, .kpi-blurb-pct {
    display: inline-block;
  }
  .kpi-blurb-pct { font-variant-numeric: tabular-nums; }

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
    padding: var(--space-3) var(--space-5);
    margin-bottom: var(--space-2);
    box-shadow: var(--elev-1);
    transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
    /* Skip rendering offscreen cards — big perf win for 200+ items */
    content-visibility: auto;
    contain-intrinsic-size: 0 180px;
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
    margin-bottom: var(--space-2);
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

  .case-gaps {
    margin: 0 0 var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--border);
    border-left: 3px solid var(--c-weak);
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .case-gaps-title {
    font-size: var(--type-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: var(--space-2);
    font-weight: 600;
  }
  .case-gaps ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }
  .case-gaps li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 2px var(--space-2);
    align-items: baseline;
  }
  .case-gaps strong,
  .case-gaps span,
  .case-gaps em {
    min-width: 0;
  }
  .case-gaps strong {
    font-size: var(--type-sm);
    font-weight: 600;
  }
  .case-gaps li > span:not(.gap-severity),
  .case-gaps em {
    grid-column: 2;
    color: var(--muted);
    font-size: var(--type-xs);
    line-height: 1.4;
  }
  .case-gaps em {
    font-style: normal;
    color: var(--fg);
  }
  .gap-severity {
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 1px 7px;
    font-size: var(--type-xs);
    text-transform: uppercase;
  }
  .gap-severity--critical {
    color: var(--c-theater);
    border-color: var(--c-theater-border);
    background: var(--c-theater-bg);
  }
  .gap-severity--important {
    color: var(--c-weak);
    border-color: var(--c-weak-border);
    background: var(--c-weak-bg);
  }
  .gap-severity--useful {
    color: var(--muted);
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
    outline: 2px solid var(--accent);
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

  /* Evidence section (revealed by Show evidence button) */
  .case-evidence {
    margin: 0 0 var(--space-3);
    padding: var(--space-3);
    border: 1px dashed var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .case-evidence[hidden] { display: none; }
  .evidence-title {
    font-size: var(--type-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: var(--space-2);
    font-weight: 600;
  }
  .signal-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .signal {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .signal-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .signal-name {
    font-family: var(--vscode-editor-font-family);
    font-size: var(--type-sm);
    font-weight: 600;
    background: transparent;
    padding: 0;
  }
  .signal-weight {
    color: var(--muted);
    font-size: var(--type-xs);
    font-variant-numeric: tabular-nums;
  }
  .signal-loc {
    font-family: var(--vscode-editor-font-family);
    font-size: var(--type-xs);
    color: var(--vscode-textLink-foreground);
    margin-left: auto;
  }
  .signal-detail {
    color: var(--muted);
    font-size: var(--type-sm);
    line-height: 1.5;
  }

  .ai-review {
    margin: 0 0 var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .ai-review--accepted { border-left-color: var(--c-strong); }
  .ai-review--challenged, .ai-review--error { border-left-color: var(--c-weak); }
  .ai-review-title {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: var(--type-sm);
    font-weight: 600;
    margin-bottom: var(--space-2);
  }
  .ai-review-title span {
    color: var(--muted);
    font-weight: 400;
    white-space: nowrap;
  }
  .ai-review p {
    font-size: var(--type-sm);
    margin-bottom: var(--space-2);
  }
  .muted {
    color: var(--muted);
  }
  .ai-anchors {
    margin: 0 0 var(--space-2);
    padding-left: var(--space-5);
  }
  .ai-anchors li {
    margin-bottom: var(--space-2);
  }
  .ai-line {
    color: var(--vscode-textLink-foreground);
    margin-right: var(--space-2);
    font-size: var(--type-xs);
  }
  .ai-anchors code, .ai-code {
    font-family: var(--vscode-editor-font-family);
    font-size: var(--type-sm);
  }
  .ai-anchors code {
    display: inline-block;
    margin-right: var(--space-2);
  }
  .ai-fix {
    font-size: var(--type-sm);
    margin-bottom: var(--space-2);
  }
  .ai-code {
    overflow-x: auto;
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    background: var(--vscode-textCodeBlock-background, var(--surface-elevated));
  }
  .ai-uncertainty {
    color: var(--c-weak);
  }

  .empty {
    color: var(--muted);
    font-style: italic;
    padding: var(--space-8) var(--space-4);
    text-align: center;
  }

  .hidden-note {
    font-size: var(--type-xs);
    color: var(--muted);
    font-style: italic;
  }

  /* Inline spinner for buttons doing async work (AI review, rescan, etc.) */
  .spinner {
    display: inline-block;
    width: 11px;
    height: 11px;
    border: 1.5px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: -1px;
    margin-right: 6px;
    flex-shrink: 0;
  }
  .btn.busy {
    display: inline-flex;
    align-items: center;
    opacity: 0.85;
    cursor: progress;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner { animation: none; border-top-color: currentColor; opacity: 0.5; }
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
`;
