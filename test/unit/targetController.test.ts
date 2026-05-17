import assert from 'node:assert/strict';
import Module = require('node:module');
import { test } from 'node:test';
import type { CaseFileBundle } from '../../src/services/caseFile';

test('target controller refuses Git-backed refresh in untrusted workspaces', async () => {
  const catalogCalls: unknown[] = [];
  const { TargetController, output } = loadController({
    trusted: false,
    catalogCalls,
  });
  const controller = new TargetController(controllerOptions(output));

  await controller.refreshTargets();

  assert.equal(catalogCalls.length, 0);
  assert.match(output.lines.join('\n'), /refused refresh targets/);
});

test('target controller adds a repo and refreshes catalog from persisted roots', async () => {
  const catalogCalls: unknown[] = [];
  const state = new FakeMemento();
  const { TargetController, infoMessages } = loadController({
    trusted: true,
    openDialogPath: '/workspace/repo/subdir',
    normalizeRoot: '/workspace/repo',
    catalogCalls,
  });
  const controller = new TargetController(controllerOptions(undefined, state));

  await controller.addRepository();

  assert.deepEqual(state.get('testInspector.trackedRepoPaths', []), ['/workspace/repo']);
  assert.deepEqual(catalogCalls[0], {
    trackedRepoPaths: ['/workspace/repo'],
    workspaceFolders: ['/workspace/current'],
  });
  assert.match(infoMessages[0] ?? '', /tracking repo/);
});

test('target controller publishes a feature-filtered bundle from custom scope', async () => {
  let published: CaseFileBundle | null = null;
  const { TargetController } = loadController({
    trusted: true,
    quickPick: { label: 'Type a feature filter...', query: '__custom__' },
    inputValue: 'auth',
  });
  const controller = new TargetController(controllerOptions(undefined, undefined, (bundle) => {
    published = bundle;
  }));

  controller.setLatestRawBundle(bundleFixture());
  await controller.selectFeatureScope();

  assert.ok(published);
  const result = published as CaseFileBundle;
  assert.equal(result.cases.length, 1);
  assert.match(result.cases[0]!.target.path, /auth/);
  assert.equal(controller.featureScope.kind, 'query');
});

function loadController(opts: {
  trusted: boolean;
  openDialogPath?: string;
  normalizeRoot?: string | null;
  catalogCalls?: unknown[];
  quickPick?: unknown;
  inputValue?: string;
}) {
  const output = outputMock();
  const infoMessages: string[] = [];
  const warningMessages: string[] = [];
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const modulePath of [
    '../../src/services/targetController',
    '../../src/services/trackedRepos',
    '../../src/services/workspaceCatalog',
    '../../src/views/targetsView',
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
  const vscode = vscodeMock(opts, infoMessages, warningMessages);
  const workspaceCatalog = {
    normalizeRepoRoot: async () => opts.normalizeRoot ?? null,
    discoverRepositoryCatalog: async (input: unknown) => {
      opts.catalogCalls?.push(input);
      return [];
    },
  };
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'vscode') return vscode;
    if (moduleName === './workspaceCatalog') return workspaceCatalog;
    return original(moduleName, parent, isMain);
  };
  try {
    return {
      ...(require('../../src/services/targetController') as typeof import('../../src/services/targetController')),
      output,
      infoMessages,
      warningMessages,
    };
  } finally {
    loader._load = original;
  }
}

function controllerOptions(
  output = outputMock(),
  state = new FakeMemento(),
  onPublishBundle: (bundle: CaseFileBundle) => void = () => {},
): ConstructorParameters<typeof import('../../src/services/targetController').TargetController>[0] {
  return {
    context: { globalState: state } as unknown as import('vscode').ExtensionContext,
    output: output as unknown as import('vscode').OutputChannel,
    onScanTarget: async () => {},
    onPublishBundle,
  };
}

function vscodeMock(
  opts: { trusted: boolean; openDialogPath?: string; quickPick?: unknown; inputValue?: string },
  infoMessages: string[],
  warningMessages: string[],
) {
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
    command?: { command: string; title: string; arguments?: unknown[] };
    resourceUri?: unknown;
    constructor(readonly label: string, readonly collapsibleState: number) {}
  }
  return {
    EventEmitter,
    ThemeIcon,
    ThemeColor,
    TreeItem,
    TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
    Uri: { file: (fsPath: string) => ({ fsPath }) },
    workspace: {
      isTrusted: opts.trusted,
      workspaceFolders: [{ uri: { fsPath: '/workspace/current' } }],
    },
    window: {
      showOpenDialog: async () => opts.openDialogPath ? [{ fsPath: opts.openDialogPath }] : undefined,
      showInformationMessage: async (message: string) => {
        infoMessages.push(message);
      },
      showWarningMessage: async (message: string) => {
        warningMessages.push(message);
      },
      showQuickPick: async () => opts.quickPick,
      showInputBox: async () => opts.inputValue,
    },
  };
}

function outputMock() {
  return {
    lines: [] as string[],
    appendLine(line: string) {
      this.lines.push(line);
    },
  };
}

class FakeMemento {
  private values = new Map<string, unknown>();

  get<T>(key: string, fallback: T): T {
    return (this.values.get(key) as T | undefined) ?? fallback;
  }

  async update(key: string, value: unknown): Promise<void> {
    this.values.set(key, value);
  }
}

function bundleFixture(): CaseFileBundle {
  return {
    scanTimestamp: 1,
    cases: [
      {
        target: { kind: 'source', path: '/repo/src/auth/login.ts', projectId: 'p1' },
        verdict: 'MISSING',
        killPriority: 1,
        story: { headline: 'auth', paragraph: 'auth' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'add', text: 'Add auth test.' },
      },
      {
        target: { kind: 'source', path: '/repo/src/billing/invoice.ts', projectId: 'p1' },
        verdict: 'MISSING',
        killPriority: 1,
        story: { headline: 'billing', paragraph: 'billing' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'add', text: 'Add billing test.' },
      },
    ],
    totals: { THEATER: 0, WEAK: 0, MISSING: 2, STRONG: 0, OK: 0 },
  };
}
