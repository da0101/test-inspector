import assert from 'node:assert/strict';
import Module = require('node:module');
import { test } from 'node:test';
import type { CaseFileBundle } from '../../src/services/caseFile';

test('reports view validates selected groups and reports generation progress inline', async () => {
  const messages: unknown[] = [];
  let received: ((message: unknown) => void) | undefined;
  let coverageCalled = false;
  const vscode = vscodeControllerMock();
  const { ReportsViewProvider } = loadWithVscodeMock<typeof import('../../src/views/reports/panel')>(
    vscode,
    () => require('../../src/views/reports/panel'),
  );
  const provider = new ReportsViewProvider({ extensionUri: { fsPath: '/extension' } } as never, async (_mode, _verdicts, onProgress) => {
    onProgress('1/1 reportController.ts');
    return true;
  }, async (onProgress) => {
    coverageCalled = true;
    onProgress('npm run coverage');
    return true;
  });
  await provider.resolveWebviewView(webviewViewMock(messages, (handler) => { received = handler; }) as never);

  received?.({ type: 'generate', mode: 'deterministic', verdicts: [] });
  await Promise.resolve();
  received?.({ type: 'generate', mode: 'deterministic', verdicts: ['MISSING'] });
  await Promise.resolve();
  received?.({ type: 'coverage' });
  await Promise.resolve();

  assert.match(JSON.stringify(messages), /Choose at least one group/);
  assert.match(JSON.stringify(messages), /Report exported/);
  assert.match(JSON.stringify(messages), /Coverage generated/);
  assert.equal(coverageCalled, true);
});

test('reports view renders updates, focuses sidebar, and reports failures inline', async () => {
  const messages: unknown[] = [];
  const commands: unknown[][] = [];
  let received: ((message: unknown) => void) | undefined;
  const vscode = vscodeControllerMock({ commands });
  const { ReportsViewProvider } = loadWithVscodeMock<typeof import('../../src/views/reports/panel')>(
    vscode,
    () => require('../../src/views/reports/panel'),
  );
  const provider = new ReportsViewProvider(
    { extensionUri: { fsPath: '/extension' } } as never,
    async () => {
      throw new Error('export failed');
    },
    async () => false,
  );
  const view = webviewViewMock(messages, (handler) => { received = handler; });

  provider.update(bundleFixture());
  provider.focus();
  await provider.resolveWebviewView(view as never);
  provider.update(bundleFixture());
  received?.({ type: 'unknown' });
  received?.({ type: 'generate', mode: 'ai', verdicts: ['WEAK'] });
  await Promise.resolve();
  received?.({ type: 'coverage' });
  await Promise.resolve();

  assert.deepEqual(commands[0], ['testInspector.reports.focus']);
  assert.match(view.webview.html, /<strong>1<\/strong><span>cases<\/span>/);
  assert.match(JSON.stringify(messages), /export failed/);
  assert.match(JSON.stringify(messages), /Coverage cancelled/);
});

test('reports view shows coverage unavailable when no coverage runner exists', async () => {
  const messages: unknown[] = [];
  let received: ((message: unknown) => void) | undefined;
  const vscode = vscodeControllerMock();
  const { ReportsViewProvider } = loadWithVscodeMock<typeof import('../../src/views/reports/panel')>(
    vscode,
    () => require('../../src/views/reports/panel'),
  );
  const provider = new ReportsViewProvider({ extensionUri: { fsPath: '/extension' } } as never, async () => true);
  await provider.resolveWebviewView(webviewViewMock(messages, (handler) => { received = handler; }) as never);

  received?.({ type: 'coverage' });
  await Promise.resolve();

  assert.match(JSON.stringify(messages), /Coverage generation is not available/);
});

test('reviewer panel renders provider state and handles delete messages', async () => {
  const deleted: string[] = [];
  let received: ((message: unknown) => void) | undefined;
  const provider = {
    id: 'gemini',
    displayName: 'Gemini',
    defaultModel: 'gemini-test',
    suggestedModels: ['gemini-test'],
    isConfigured: async () => true,
    testConnection: async () => ({ ok: true as const, text: 'ok', modelUsed: 'gemini-test' }),
    complete: async () => ({ ok: false as const, error: 'unused' }),
  };
  const vscode = vscodeControllerMock({ provider: 'gemini' });
  const { ReviewerViewProvider } = loadWithVscodeMock<typeof import('../../src/views/reviewer/panel')>(
    vscode,
    () => require('../../src/views/reviewer/panel'),
  );
  const view = webviewViewMock([], (handler) => { received = handler; });
  const panel = new ReviewerViewProvider(
    { extensionUri: { fsPath: '/extension' }, secrets: { delete: async (key: string) => { deleted.push(key); } } } as never,
    new Map([['gemini', provider]]) as never,
    { appendLine() {} } as never,
  );

  await panel.resolveWebviewView(view as never);
  received?.({ type: 'delete', provider: 'gemini' });
  await Promise.resolve();

  assert.match(view.webview.html, /Gemini/);
  assert.deepEqual(deleted, ['testInspector.llm.gemini.apiKey']);
});

function loadWithVscodeMock<T>(vscode: unknown, load: () => T): T {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const request of [
    '../../src/views/reports/panel',
    '../../src/views/reviewer/panel',
    '../../src/views/reviewer/template',
    '../../src/views/reports/template',
  ]) {
    delete require.cache[require.resolve(request)];
  }
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'vscode') return vscode;
    return original(moduleName, parent, isMain);
  };
  try {
    return load();
  } finally {
    loader._load = original;
  }
}

function vscodeControllerMock(opts: { commands?: unknown[][]; provider?: string } = {}) {
  const cfg = {
    get: (key: string) => {
      if (key === 'provider') return opts.provider ?? 'none';
      if (key === 'model') return '';
      return undefined;
    },
    update: async () => {},
  };
  return {
    ConfigurationTarget: { Global: 1 },
    Uri: {
      file: (fsPath: string) => ({ fsPath }),
      joinPath: (uri: { fsPath: string }, ...parts: string[]) => ({ fsPath: [uri.fsPath, ...parts].join('/') }),
    },
    workspace: {
      asRelativePath: (value: string) => value,
      getConfiguration: () => cfg,
    },
    window: {
      showInformationMessage: async () => undefined,
      showWarningMessage: async () => undefined,
    },
    commands: {
      executeCommand: async (...args: unknown[]) => {
        opts.commands?.push(args);
      },
    },
  };
}

function webviewViewMock(messages: unknown[], receive: (handler: (message: unknown) => void) => void) {
  return {
    webview: {
      cspSource: 'vscode-resource:',
      html: '',
      options: {},
      onDidReceiveMessage: (handler: (message: unknown) => void) => receive(handler),
      postMessage: async (message: unknown) => {
        messages.push(message);
        return true;
      },
    },
  };
}

function bundleFixture(): CaseFileBundle {
  return {
    scanTimestamp: 1,
    cases: [
      {
        target: { kind: 'source', path: '/repo/src/api.ts', projectId: 'node:/repo' },
        verdict: 'MISSING',
        killPriority: 60,
        story: { headline: 'api.ts — critical code with no tests', paragraph: 'No related tests.' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'add', text: 'Add tests.' },
      },
    ],
    totals: { THEATER: 0, WEAK: 0, MISSING: 1, STRONG: 0, OK: 0 },
  };
}
