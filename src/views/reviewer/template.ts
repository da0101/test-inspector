import type { LlmProviderId } from '../../services/llm';

export type ReviewerProviderInfo = {
  id: LlmProviderId;
  displayName: string;
  defaultModel: string;
  suggestedModels: string[];
};

export type ReviewerState = {
  /** Currently active provider, or 'none' if AI is disabled. */
  activeProvider: LlmProviderId | 'none';
  /** Currently configured model name (may be empty if relying on default). */
  activeModel: string;
  /** Set of provider IDs that have an API key stored in SecretStorage. */
  configuredProviders: LlmProviderId[];
  /** All providers the registry exposes. */
  providers: ReviewerProviderInfo[];
  /** Last test-connection result, if the user has run one in this session. */
  lastTest?: { ok: boolean; message: string; at: number };
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

export function renderReviewerHtml(state: ReviewerState, opts: { nonce: string; cspSource: string }): string {
  const isConfigured = state.activeProvider !== 'none' && state.configuredProviders.includes(state.activeProvider as LlmProviderId);
  const activeProviderInfo = state.providers.find((p) => p.id === state.activeProvider);
  const activeDisplayName = activeProviderInfo?.displayName ?? 'Disabled';
  const activeModel = state.activeModel || activeProviderInfo?.defaultModel || '';

  const providerOptions = `
    <option value="none" ${state.activeProvider === 'none' ? 'selected' : ''}>Off</option>
    ${state.providers
      .map((p) => {
        const configured = state.configuredProviders.includes(p.id) ? ' (key set)' : '';
        return `<option value="${escapeHtml(p.id)}" ${state.activeProvider === p.id ? 'selected' : ''}>${escapeHtml(p.displayName)}${configured}</option>`;
      })
      .join('')}
  `;

  const modelOptions = activeProviderInfo
    ? activeProviderInfo.suggestedModels
        .map((m) => `<option value="${escapeHtml(m)}" ${m === activeModel ? 'selected' : ''}>${escapeHtml(m)}</option>`)
        .join('')
    : '';

  const statusBadge = state.activeProvider === 'none'
    ? `<span class="status status-off">Off</span>`
    : isConfigured
      ? `<span class="status status-ok">Ready</span>`
      : `<span class="status status-pending">Key missing</span>`;

  const lastTestRow = state.lastTest
    ? `<div class="test-result ${state.lastTest.ok ? 'ok' : 'err'}">${state.lastTest.ok ? '✓' : '✗'} ${escapeHtml(state.lastTest.message)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; script-src 'nonce-${opts.nonce}';" />
  <title>AI Reviewer</title>
  <style>
    :root {
      --type-xs: 11px;
      --type-sm: 12px;
      --type-base: 13px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --radius: 4px;
      --muted: var(--vscode-descriptionForeground);
      --border: var(--vscode-panel-border);
    }
    * { box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--type-base);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background, transparent);
      margin: 0;
      padding: var(--space-3);
      line-height: 1.4;
    }
    .status-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
      font-size: var(--type-sm);
    }
    .status {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: var(--type-xs);
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .status-ok { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .status-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .status-off { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    .status-text {
      color: var(--muted);
      font-size: var(--type-xs);
    }
    label {
      display: block;
      font-size: var(--type-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin: var(--space-3) 0 4px;
      font-weight: 600;
    }
    select, input[type="password"], input[type="text"] {
      width: 100%;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, var(--border));
      border-radius: var(--radius);
      padding: 4px 8px;
      font-family: inherit;
      font-size: var(--type-sm);
    }
    select:focus, input:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;
    }
    .key-row {
      display: flex;
      gap: 4px;
    }
    .key-row input {
      flex: 1;
    }
    .key-row button.toggle-visibility {
      background: var(--vscode-button-secondaryBackground, transparent);
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
      border: 1px solid var(--vscode-input-border, var(--border));
      padding: 0 8px;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: var(--type-xs);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: var(--space-3);
    }
    button {
      font-family: inherit;
      font-size: var(--type-sm);
      cursor: pointer;
      padding: 4px 10px;
      border-radius: var(--radius);
      border: 1px solid var(--vscode-button-border, transparent);
    }
    button.primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    button.primary:hover { background: var(--vscode-button-hoverBackground); }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border-color: var(--vscode-button-border, var(--border));
    }
    button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground)); }
    button.danger {
      background: transparent;
      color: var(--vscode-errorForeground, #ef4444);
      border-color: transparent;
    }
    button.danger:hover { background: var(--vscode-list-hoverBackground); }
    button[disabled] { opacity: 0.5; cursor: not-allowed; }
    .help {
      font-size: var(--type-xs);
      color: var(--muted);
      margin-top: var(--space-3);
      line-height: 1.5;
    }
    .help a {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
    }
    .help a:hover { text-decoration: underline; }
    .test-result {
      margin-top: var(--space-2);
      font-size: var(--type-xs);
      padding: 4px 8px;
      border-radius: var(--radius);
    }
    .test-result.ok { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .test-result.err { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .spinner {
      display: inline-block;
      width: 10px;
      height: 10px;
      border: 1.5px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      vertical-align: -1px;
      margin-right: 5px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
  </style>
</head>
<body>
  <div class="status-row">
    ${statusBadge}
    <span class="status-text">${escapeHtml(activeDisplayName)}${activeModel ? ' · ' + escapeHtml(activeModel) : ''}</span>
  </div>

  <label for="provider">Provider</label>
  <select id="provider">${providerOptions}</select>

  <label for="model" ${state.activeProvider === 'none' ? 'style="display:none"' : ''}>Model</label>
  <select id="model" ${state.activeProvider === 'none' ? 'style="display:none"' : ''}>${modelOptions}</select>

  <label for="apikey" ${state.activeProvider === 'none' ? 'style="display:none"' : ''}>API key</label>
  <div class="key-row" ${state.activeProvider === 'none' ? 'style="display:none"' : ''}>
    <input type="password" id="apikey" placeholder="${isConfigured ? '(key already stored — paste a new one to replace)' : 'paste key here'}" autocomplete="off" spellcheck="false" />
    <button type="button" class="toggle-visibility" id="toggle-visibility" title="Show / hide key">👁</button>
  </div>

  <div class="actions" ${state.activeProvider === 'none' ? 'style="display:none"' : ''}>
    <button type="button" class="primary" id="save">Save</button>
    <button type="button" class="secondary" id="test" ${isConfigured ? '' : 'disabled'}>Test</button>
    <button type="button" class="danger" id="delete" ${isConfigured ? '' : 'disabled'}>Delete key</button>
  </div>

  ${lastTestRow}

  <div class="help">
    Keys are stored in VS Code SecretStorage — never written to settings, logs, or reports.
    <br/>
    <a href="https://aistudio.google.com/apikey">Get a Gemini key (free tier)</a> ·
    <a href="https://platform.openai.com/api-keys">OpenAI</a> ·
    <a href="https://console.anthropic.com/settings/keys">Anthropic Claude</a>
  </div>

  <script nonce="${opts.nonce}">
    const vscode = acquireVsCodeApi();

    const providerEl = document.getElementById('provider');
    const modelEl = document.getElementById('model');
    const apiKeyEl = document.getElementById('apikey');
    const toggleVisibilityBtn = document.getElementById('toggle-visibility');
    const saveBtn = document.getElementById('save');
    const testBtn = document.getElementById('test');
    const deleteBtn = document.getElementById('delete');

    function setBusy(btn, label) {
      btn.dataset.original = btn.textContent;
      btn.innerHTML = '<span class="spinner"></span>' + label;
      btn.disabled = true;
    }

    providerEl?.addEventListener('change', () => {
      vscode.postMessage({ type: 'selectProvider', provider: providerEl.value });
    });
    modelEl?.addEventListener('change', () => {
      vscode.postMessage({ type: 'selectModel', model: modelEl.value });
    });
    toggleVisibilityBtn?.addEventListener('click', () => {
      if (!apiKeyEl) return;
      apiKeyEl.type = apiKeyEl.type === 'password' ? 'text' : 'password';
    });
    saveBtn?.addEventListener('click', () => {
      const apiKey = apiKeyEl?.value?.trim();
      setBusy(saveBtn, 'Saving…');
      vscode.postMessage({
        type: 'save',
        provider: providerEl?.value,
        model: modelEl?.value,
        apiKey: apiKey || undefined,
      });
    });
    testBtn?.addEventListener('click', () => {
      setBusy(testBtn, 'Testing…');
      vscode.postMessage({ type: 'test', provider: providerEl?.value });
    });
    deleteBtn?.addEventListener('click', () => {
      vscode.postMessage({ type: 'delete', provider: providerEl?.value });
    });
  </script>
</body>
</html>`;
}
