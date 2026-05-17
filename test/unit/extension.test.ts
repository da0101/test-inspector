import assert from 'node:assert/strict';
import Module = require('node:module');
import { test } from 'node:test';

test('extension activation wires views and commands without scanning untrusted workspaces', () => {
  const registeredCommands: string[] = [];
  const registeredViews: string[] = [];
  const outputLines: string[] = [];
  const vscode = vscodeActivationMock({ registeredCommands, registeredViews, outputLines });
  const { activate, deactivate } = loadWithVscodeMock<typeof import('../../src/extension')>(
    vscode,
    () => require('../../src/extension'),
  );
  const context = {
    extension: { packageJSON: { version: 'test' } },
    extensionUri: { fsPath: '/extension' },
    globalState: { get: (_key: string, fallback: unknown) => fallback, update: async () => {}, keys: () => [] },
    secrets: { get: async () => undefined, store: async () => {}, delete: async () => {}, onDidChange: () => ({ dispose() {} }) },
    subscriptions: [],
  };

  activate(context as never);
  deactivate();

  assert.ok(registeredViews.includes('testInspector.targets'));
  assert.ok(registeredViews.includes('testInspector.cases'));
  assert.ok(registeredViews.includes('testInspector.reports'));
  assert.ok(registeredCommands.includes('testInspector.scanTarget'));
  assert.ok(registeredCommands.includes('testInspector.generateReport'));
  assert.ok(registeredCommands.includes('testInspector.generateCoverage'));
  assert.match(outputLines.join('\n'), /command registration complete/);
  assert.match(outputLines.join('\n'), /refused refresh targets/);
});

function loadWithVscodeMock<T>(vscode: unknown, load: () => T): T {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  delete require.cache[require.resolve('../../src/extension')];
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

function vscodeActivationMock(opts: { registeredCommands: string[]; registeredViews: string[]; outputLines: string[] }) {
  class EventEmitter<T> {
    event = () => ({ dispose() {} });
    fire(_value: T): void {}
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
  const disposable = { dispose() {} };
  return {
    EventEmitter,
    ThemeIcon,
    ThemeColor,
    TreeItem,
    TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
    StatusBarAlignment: { Left: 1 },
    ProgressLocation: { Notification: 1 },
    ViewColumn: { Active: 1 },
    Uri: {
      file: (fsPath: string) => ({ fsPath }),
      joinPath: (uri: { fsPath: string }, ...parts: string[]) => ({ fsPath: [uri.fsPath, ...parts].join('/') }),
    },
    workspace: {
      isTrusted: false,
      workspaceFolders: [],
      getConfiguration: () => ({ get: () => undefined, update: async () => {} }),
      asRelativePath: (value: unknown) => String(value),
      fs: { writeFile: async () => {} },
    },
    window: {
      createOutputChannel: () => ({ appendLine: (line: string) => opts.outputLines.push(line), dispose() {} }),
      createStatusBarItem: () => ({ show() {}, dispose() {} }),
      registerTreeDataProvider: (viewId: string) => {
        opts.registeredViews.push(viewId);
        return disposable;
      },
      registerWebviewViewProvider: (viewId: string) => {
        opts.registeredViews.push(viewId);
        return disposable;
      },
      showWarningMessage: async () => undefined,
      showInformationMessage: async () => undefined,
      withProgress: async (_opts: unknown, task: () => Promise<unknown>) => task(),
    },
    commands: {
      registerCommand: (command: string) => {
        opts.registeredCommands.push(command);
        return disposable;
      },
      executeCommand: async () => undefined,
    },
    tests: {
      createTestController: () => ({
        createTestItem: () => ({ children: { add() {} } }),
        items: { replace() {} },
        dispose() {},
      }),
    },
    env: { clipboard: { writeText: async () => {} } },
    ConfigurationTarget: { Workspace: 1, Global: 2 },
  };
}
