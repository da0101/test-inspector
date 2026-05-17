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

test('targets tree renders empty state and non-active candidate repos', () => {
  const { WorkspaceTargetsProvider } = loadWithVscodeMock<typeof import('../../src/views/targetsView')>(
    vscodeTreeMock(),
    () => require('../../src/views/targetsView'),
  );
  const provider = new WorkspaceTargetsProvider();

  const empty = provider.getChildren()[0];
  const emptyItem = provider.getTreeItem(empty);
  provider.update([
    {
      id: 'repo:/repo',
      name: 'repo',
      path: '/repo',
      source: 'workspace',
      diagnostics: ['not tracked yet'],
      worktrees: [{ id: 'wt:/repo-feature', repoPath: '/repo', path: '/repo-feature', branch: 'feature/x', isMain: false, source: 'workspace' }],
    },
  ], null);
  const repo = provider.getChildren()[0];
  const worktree = provider.getChildren(repo)[0];
  const repoItem = provider.getTreeItem(repo);
  const worktreeItem = provider.getTreeItem(worktree);

  assert.equal(emptyItem.command?.command, 'testInspector.addRepository');
  assert.equal(repoItem.contextValue, 'repoCandidate');
  assert.equal(worktreeItem.description, 'feature/x');
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

test('cases tree groups multi-project bundles by project then verdict', () => {
  const { CasesTreeProvider } = loadWithVscodeMock<typeof import('../../src/views/casesView')>(
    vscodeTreeMock(),
    () => require('../../src/views/casesView'),
  );
  const provider = new CasesTreeProvider();
  provider.update(multiProjectBundleFixture());

  const projects = provider.getChildren();
  const firstProjectItem = provider.getTreeItem(projects[0]);
  const groups = provider.getChildren(projects[0]);
  const groupItem = provider.getTreeItem(groups[0]);
  const caseItem = provider.getTreeItem(provider.getChildren(groups[0])[0]);

  assert.equal(firstProjectItem.label, 'API (node)');
  assert.equal(firstProjectItem.description, '1 strong');
  assert.equal(groupItem.label, 'Strong (1)');
  assert.equal(caseItem.description, 'healthy');
});

test('cases tree returns empty children for case leaves and strips only matching prefixes', () => {
  const { CasesTreeProvider } = loadWithVscodeMock<typeof import('../../src/views/casesView')>(
    vscodeTreeMock(),
    () => require('../../src/views/casesView'),
  );
  const provider = new CasesTreeProvider();
  provider.update({
    ...bundleFixture(),
    cases: [{
      ...bundleFixture().cases[0],
      story: { headline: 'Different headline', paragraph: 'No related tests.' },
    }],
  });

  const group = provider.getChildren()[0];
  const leaf = provider.getChildren(group)[0];
  const item = provider.getTreeItem(leaf);

  assert.deepEqual(provider.getChildren(leaf), []);
  assert.equal(item.description, 'Different headline');
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

function multiProjectBundleFixture(): CaseFileBundle {
  return {
    scanTimestamp: 1,
    projects: [
      { id: 'react:/repo/web', rootPath: '/repo/web', framework: 'react', label: 'Web', configFiles: [] },
      { id: 'node:/repo/api', rootPath: '/repo/api', framework: 'node', label: 'API', configFiles: [] },
    ],
    cases: [
      {
        target: { kind: 'test', path: '/repo/web/src/App.test.tsx', projectId: 'react:/repo/web' },
        verdict: 'WEAK',
        killPriority: 20,
        story: { headline: 'App.test.tsx — shallow render', paragraph: 'Weak.' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'rewrite', text: 'Add behavior.' },
      },
      {
        target: { kind: 'test', path: '/repo/api/test/api.test.ts', projectId: 'node:/repo/api' },
        verdict: 'STRONG',
        killPriority: 0,
        story: { headline: 'api.test.ts — healthy', paragraph: 'Strong.' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'ignore', text: 'No action.' },
      },
    ],
    totals: { THEATER: 0, WEAK: 1, MISSING: 0, STRONG: 1, OK: 0 },
  };
}
