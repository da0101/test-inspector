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
      testCases: [
        { id: 'case-1', name: 'handles api', filePath: '/repo/test/api.test.ts', line: 7, status: 'passed' },
        { id: 'case-2', name: 'handles first line', filePath: '/repo/test/api.test.ts', line: 1, status: 'passed' },
      ],
    },
  ];

  new TestInspectorController(state).refresh();

  assert.equal(replaced.length, 1);
  assert.equal(replaced[0]!.length, 1);
  const fileItem = replaced[0]![0] as { children: { values: Array<{ range?: { startLine: number } }> } };
  assert.deepEqual(fileItem.children.values.map((item) => item.range?.startLine), [6, 0]);
});

test('test controller handles empty files and disposes controller', () => {
  const replaced: unknown[][] = [];
  let disposed = false;
  const vscode = vscodeControllerMock({ replaced, onDispose: () => { disposed = true; } });
  const { TestInspectorController } = loadWithVscodeMock<typeof import('../../src/services/testController')>(
    vscode,
    () => require('../../src/services/testController'),
  );
  const state = new InspectorState();
  state.testFiles = [
    {
      path: '/repo/test/empty.test.ts',
      projectId: 'node:/repo',
      status: 'unknown',
      qualityFindings: [],
      testCases: [],
    },
  ];

  const controller = new TestInspectorController(state);
  controller.refresh();
  controller.dispose();

  assert.equal(replaced[0]!.length, 1);
  assert.equal(disposed, true);
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

function loadWithVscodeMock<T>(vscode: unknown, load: () => T): T {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const request of [
    '../../src/services/testController',
    '../../src/services/targetController',
    '../../src/views/caseFile/panel',
    '../../src/views/targetsView',
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
  onDispose?: () => void;
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
        createTestItem: (id: string, label: string, uri: unknown) => {
          const item = {
            id,
            label,
            uri,
            children: {
              values: [] as unknown[],
              add(child: unknown) {
                this.values.push(child);
              },
            },
          };
          return item;
        },
        items: { replace: (items: unknown[]) => opts.replaced?.push(items) },
        dispose: () => opts.onDispose?.(),
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
