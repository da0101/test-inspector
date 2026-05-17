import assert from 'node:assert/strict';
import Module = require('node:module');
import { test } from 'node:test';
import { InspectorState } from '../../src/services/state';
import type { CaseFileBundle } from '../../src/services/caseFile';

test('test controller publishes discovered test files into VS Code test items', () => {
  const replaced: unknown[][] = [];
  const vscode = vscodeControllerMock({ replaced });
  const { TestInspectorController } = loadWithVscodeMock<typeof import('../../src/services/testController')>(
    vscode,
    () => require('../../src/services/testController'),
  );
  const state = new InspectorState();
  state.testFiles = [
    {
      path: '/repo/test/api.test.ts',
      projectId: 'node:/repo',
      status: 'unknown',
      qualityFindings: [],
      testCases: [{ id: 'case-1', name: 'handles api', filePath: '/repo/test/api.test.ts', line: 7, status: 'passed' }],
    },
  ];

  new TestInspectorController(state).refresh();

  assert.equal(replaced.length, 1);
  assert.equal(replaced[0]!.length, 1);
});

test('target controller refuses Git-backed refresh in untrusted workspaces', async () => {
  const lines: string[] = [];
  const vscode = vscodeControllerMock({ isTrusted: false });
  const { TargetController } = loadWithVscodeMock<typeof import('../../src/services/targetController')>(
    vscode,
    () => require('../../src/services/targetController'),
  );
  const controller = new TargetController({
    context: { globalState: mementoMock() },
    output: { appendLine: (line: string) => lines.push(line) },
    onScanTarget: async () => {},
    onPublishBundle: () => {},
  } as never);

  await controller.refreshTargets();

  assert.match(lines.join('\n'), /refused refresh targets/);
});

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

test('case file panel handles webview commands without mutating source files', () => {
  const commands: unknown[][] = [];
  const clipboard: string[] = [];
  let received: ((message: unknown) => void) | undefined;
  const vscode = vscodeControllerMock({ commands, clipboard, receive: (handler) => { received = handler; } });
  const { CaseFilePanel } = loadWithVscodeMock<typeof import('../../src/views/caseFile/panel')>(
    vscode,
    () => require('../../src/views/caseFile/panel'),
  );
  const panel = CaseFilePanel.show({ extensionUri: { fsPath: '/extension' } } as never);
  panel.update(bundleFixture());

  received?.({ type: 'copy', text: 'Add tests.' });
  received?.({ type: 'open', path: '/repo/src/api.ts' });
  received?.({ type: 'review', path: '/repo/src/api.ts' });
  received?.({ type: 'rescan' });

  assert.deepEqual(clipboard, ['Add tests.']);
  assert.equal(commands.length, 3);
  assert.deepEqual(commands.map((cmd) => cmd[0]), ['vscode.open', '_testInspector.markReviewed', 'testInspector.refresh']);
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
    '../../src/services/testController',
    '../../src/services/targetController',
    '../../src/views/reports/panel',
    '../../src/views/caseFile/panel',
    '../../src/views/reviewer/panel',
    '../../src/views/targetsView',
    '../../src/views/reviewer/template',
    '../../src/views/reports/template',
    '../../src/views/caseFile/template',
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

function vscodeControllerMock(opts: {
  replaced?: unknown[][];
  isTrusted?: boolean;
  commands?: unknown[][];
  clipboard?: string[];
  receive?: (handler: (message: unknown) => void) => void;
  provider?: string;
} = {}) {
  class EventEmitter<T> {
    event = () => ({ dispose() {} });
    fire(_value: T): void {}
  }
  class Range {
    constructor(readonly startLine: number, readonly startChar: number, readonly endLine: number, readonly endChar: number) {}
  }
  class ThemeIcon {
    constructor(readonly id: string, readonly color?: unknown) {}
  }
  class ThemeColor {
    constructor(readonly id: string) {}
  }
  class TreeItem {
    description?: string;
    tooltip?: string;
    iconPath?: unknown;
    contextValue?: string;
    command?: unknown;
    constructor(readonly label: string, readonly collapsibleState: number) {}
  }
  const cfg = {
    get: (key: string) => {
      if (key === 'provider') return opts.provider ?? 'none';
      if (key === 'model') return '';
      return undefined;
    },
    update: async () => {},
  };
  return {
    EventEmitter,
    Range,
    ThemeIcon,
    ThemeColor,
    TreeItem,
    TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
    ConfigurationTarget: { Global: 1 },
    ViewColumn: { Active: 1 },
    Uri: {
      file: (fsPath: string) => ({ fsPath }),
      joinPath: (uri: { fsPath: string }, ...parts: string[]) => ({ fsPath: [uri.fsPath, ...parts].join('/') }),
    },
    tests: {
      createTestController: () => ({
        createTestItem: (id: string, label: string, uri: unknown) => ({
          id,
          label,
          uri,
          children: { add() {} },
        }),
        items: { replace: (items: unknown[]) => opts.replaced?.push(items) },
        dispose() {},
      }),
    },
    workspace: {
      isTrusted: opts.isTrusted ?? true,
      workspaceFolders: [],
      asRelativePath: (value: string) => value,
      getConfiguration: () => cfg,
    },
    window: {
      createWebviewPanel: () => webviewPanelMock(opts.receive),
      showInformationMessage: async () => undefined,
      showWarningMessage: async () => undefined,
    },
    commands: {
      executeCommand: async (...args: unknown[]) => {
        opts.commands?.push(args);
      },
    },
    env: {
      clipboard: {
        writeText: async (text: string) => {
          opts.clipboard?.push(text);
        },
      },
    },
  };
}

function webviewPanelMock(receive?: (handler: (message: unknown) => void) => void) {
  return {
    iconPath: undefined,
    webview: {
      cspSource: 'vscode-resource:',
      html: '',
      onDidReceiveMessage: (handler: (message: unknown) => void) => {
        receive?.(handler);
      },
    },
    onDidDispose() {},
    reveal() {},
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

function mementoMock() {
  return {
    get: (_key: string, fallback: unknown) => fallback,
    update: async () => {},
    keys: () => [],
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
