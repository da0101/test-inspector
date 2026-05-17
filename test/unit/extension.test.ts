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

test('extension command callbacks refuse unsafe untrusted test actions', async () => {
  const registeredCommands: string[] = [];
  const registeredViews: string[] = [];
  const outputLines: string[] = [];
  const warningMessages: string[] = [];
  const callbacks = new Map<string, (...args: unknown[]) => Promise<unknown>>();
  const vscode = vscodeActivationMock({ registeredCommands, registeredViews, outputLines, warningMessages, callbacks });
  const { activate } = loadWithVscodeMock<typeof import('../../src/extension')>(
    vscode,
    () => require('../../src/extension'),
  );
  const context = contextFixture();

  activate(context as never);
  await callbacks.get('testInspector.scan')?.();
  await callbacks.get('testInspector.generateCoverage')?.();
  await callbacks.get('testInspector.runCurrentFile')?.();
  await callbacks.get('_testInspector.markReviewed')?.('/repo/src/a.ts');

  assert.match(outputLines.join('\n'), /\[scan\] refused/);
  assert.match(outputLines.join('\n'), /\[coverage\] refused/);
  assert.match(outputLines.join('\n'), /\[run\] refused/);
  assert.match(warningMessages.join('\n'), /not trusted/);
});

test('extension command callbacks handle trusted no-workspace edge cases', async () => {
  const registeredCommands: string[] = [];
  const registeredViews: string[] = [];
  const outputLines: string[] = [];
  const infoMessages: string[] = [];
  const warningMessages: string[] = [];
  const callbacks = new Map<string, (...args: unknown[]) => Promise<unknown>>();
  const vscode = vscodeActivationMock({
    registeredCommands,
    registeredViews,
    outputLines,
    infoMessages,
    warningMessages,
    callbacks,
    trusted: true,
    workspaceFolders: [],
  });
  const { activate } = loadWithVscodeMock<typeof import('../../src/extension')>(
    vscode,
    () => require('../../src/extension'),
  );

  activate(contextFixture() as never);
  await callbacks.get('testInspector.generateCoverage')?.();
  await callbacks.get('testInspector.runCurrentFile')?.();
  await callbacks.get('_testInspector.markReviewed')?.('/repo/src/a.ts');

  assert.match(infoMessages.join('\n'), /open a workspace|open a test file/i);
  assert.match(warningMessages.join('\n'), /open a workspace folder/i);
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

function contextFixture() {
  return {
    extension: { packageJSON: { version: 'test' } },
    extensionUri: { fsPath: '/extension' },
    globalState: { get: (_key: string, fallback: unknown) => fallback, update: async () => {}, keys: () => [] },
    secrets: { get: async () => undefined, store: async () => {}, delete: async () => {}, onDidChange: () => ({ dispose() {} }) },
    subscriptions: [],
  };
}

function vscodeActivationMock(opts: {
  registeredCommands: string[];
  registeredViews: string[];
  outputLines: string[];
  infoMessages?: string[];
  warningMessages?: string[];
  callbacks?: Map<string, (...args: unknown[]) => Promise<unknown>>;
  trusted?: boolean;
  workspaceFolders?: Array<{ uri: { fsPath: string } }>;
}) {
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
      isTrusted: opts.trusted ?? false,
      workspaceFolders: opts.workspaceFolders ?? [],
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
      showWarningMessage: async (message: string) => {
        opts.warningMessages?.push(message);
        return undefined;
      },
      showInformationMessage: async (message: string) => {
        opts.infoMessages?.push(message);
        return undefined;
      },
      withProgress: async (_opts: unknown, task: () => Promise<unknown>) => task(),
    },
    commands: {
      registerCommand: (command: string, callback: (...args: unknown[]) => Promise<unknown>) => {
        opts.registeredCommands.push(command);
        opts.callbacks?.set(command, callback);
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
