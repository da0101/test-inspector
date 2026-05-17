import assert from 'node:assert/strict';
import Module = require('node:module');
import { test } from 'node:test';
import type { CaseFileBundle } from '../../src/services/caseFile';

test('targets tree renders repos, active worktrees, and scan commands', () => {
  const { WorkspaceTargetsProvider } = loadWithVscodeMock<typeof import('../../src/views/targetsView')>(
    vscodeTreeMock(),
    () => require('../../src/views/targetsView'),
  );
  const provider = new WorkspaceTargetsProvider();
  provider.update([
    {
      id: 'repo:/repo',
      name: 'repo',
      path: '/repo',
      source: 'tracked',
      diagnostics: [],
      worktrees: [{ id: 'wt:/repo', repoPath: '/repo', path: '/repo', branch: 'main', isMain: true, source: 'tracked' }],
    },
  ], '/repo');

  const repos = provider.getChildren();
  const worktrees = provider.getChildren(repos[0]);
  const item = provider.getTreeItem(worktrees[0]);

  assert.equal(item.label, 'repo');
  assert.equal(item.description, 'main · active');
  assert.equal(item.command?.command, 'testInspector.scanTarget');
});

test('cases tree groups single-project bundles by verdict and opens case files', () => {
  const { CasesTreeProvider } = loadWithVscodeMock<typeof import('../../src/views/casesView')>(
    vscodeTreeMock(),
    () => require('../../src/views/casesView'),
  );
  const provider = new CasesTreeProvider();
  provider.update(bundleFixture());

  const groups = provider.getChildren();
  const groupItem = provider.getTreeItem(groups[0]);
  const cases = provider.getChildren(groups[0]);
  const caseItem = provider.getTreeItem(cases[0]);

  assert.equal(groupItem.label, 'Missing (1)');
  assert.equal(caseItem.label, 'api.ts');
  assert.equal(caseItem.command?.command, 'vscode.open');
});

function loadWithVscodeMock<T>(vscode: unknown, load: () => T): T {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const request of ['../../src/views/targetsView', '../../src/views/casesView']) {
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

function vscodeTreeMock() {
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
  };
}

function bundleFixture(): CaseFileBundle {
  return {
    scanTimestamp: 1,
    projects: [{ id: 'node:/repo', rootPath: '/repo', framework: 'node', label: 'Node repo', configFiles: [] }],
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
