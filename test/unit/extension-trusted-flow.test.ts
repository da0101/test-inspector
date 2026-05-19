import assert from 'node:assert/strict';
import Module = require('node:module');
import { test } from 'node:test';

test('extension command callbacks execute trusted workspace flows through service boundaries', async () => {
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
    warningChoice: 'Run coverage',
    workspaceFolders: [{ uri: { fsPath: '/repo' } }],
    activeFile: '/repo/test/a.test.ts',
  });
  const calls: string[] = [];
  const { activate } = loadExtensionWithDependencyMocks(vscode, calls, () => require('../../src/extension'));

  activate(contextFixture() as never);
  await callbacks.get('testInspector.openCaseFile')?.();
  await callbacks.get('testInspector.openDashboard')?.();
  await callbacks.get('testInspector.scan')?.();
  await callbacks.get('testInspector.refresh')?.();
  await callbacks.get('testInspector.refreshAll')?.();
  await callbacks.get('testInspector.refreshTargets')?.();
  await callbacks.get('testInspector.addRepository')?.();
  await callbacks.get('testInspector.removeRepository')?.('repo');
  await callbacks.get('testInspector.scanTarget')?.('worktree', 'repo');
  await callbacks.get('testInspector.selectFeatureScope')?.();
  await callbacks.get('testInspector.configureLlm')?.();
  await callbacks.get('testInspector.runCurrentFile')?.();
  await callbacks.get('testInspector.generateCoverage')?.();
  await callbacks.get('testInspector.generateReport')?.();
  await callbacks.get('_testInspector.markReviewed')?.('/repo/src/a.ts');

  assert.ok(calls.includes('scan:/repo'));
  assert.ok(calls.includes('coverage'));
  assert.ok(calls.includes('runFile:/repo/test/a.test.ts'));
  assert.ok(calls.includes('reportFocus'));
  assert.match(infoMessages.join('\n'), /test file passed/);
});

test('extension command callbacks handle trusted workspace alternate outcomes', async () => {
  const outputLines: string[] = [];
  const infoMessages: string[] = [];
  const warningMessages: string[] = [];
  const callbacks = new Map<string, (...args: unknown[]) => Promise<unknown>>();
  const vscode = vscodeActivationMock({
    registeredCommands: [],
    registeredViews: [],
    outputLines,
    infoMessages,
    warningMessages,
    callbacks,
    trusted: true,
    workspaceFolders: [{ uri: { fsPath: '/repo' } }],
    activeFile: '/other/test/a.test.ts',
  });
  const calls: string[] = [];
  const { activate } = loadExtensionWithDependencyMocks(vscode, calls, () => require('../../src/extension'), {
    target: null,
    coveragePlan: { planned: [], skipped: [{ label: 'React web' }], skippedSupport: 1 },
    detectedProjects: [],
  });

  activate(contextFixture() as never);
  await callbacks.get('testInspector.scan')?.();
  await callbacks.get('testInspector.generateCoverage')?.();
  await callbacks.get('testInspector.runCurrentFile')?.();

  assert.ok(calls.includes('scan:/repo'));
  assert.match(outputLines.join('\n'), /skipped 1 support fixture/);
  assert.match(warningMessages.join('\n'), /no coverage script found/);
  assert.match(warningMessages.join('\n'), /current file is not inside a detected test project/);
});

test('extension coverage command handles cancel, failed runs, and missing output', async () => {
  const cancel = await runCoverageScenario();
  assert.equal(cancel.calls.includes('coverage'), false);

  const failed = await runCoverageScenario({
    warningChoice: 'Run coverage',
    coverageResult: { runs: [{ projectId: 'node:/repo', command: 'npm run coverage', exitCode: 1, stderr: 'jest error' }], coverage: [] },
  });
  assert.match(failed.errorMessages.join('\n'), /coverage command failed/);

  const missing = await runCoverageScenario({
    warningChoice: 'Run coverage',
    coverageResult: { runs: [{ projectId: 'node:/repo', command: 'npm run coverage', exitCode: 0, stderr: '' }], coverage: [] },
  });
  assert.match(missing.errorMessages.join('\n'), /no output file/);
});

async function runCoverageScenario(options: {
  warningChoice?: string;
  coverageResult?: { runs: Array<{ projectId: string; command: string; exitCode: number; stderr?: string }>; coverage: unknown[] };
} = {}): Promise<{ calls: string[]; errorMessages: string[] }> {
  const callbacks = new Map<string, (...args: unknown[]) => Promise<unknown>>();
  const errorMessages: string[] = [];
  const vscode = vscodeActivationMock({
    registeredCommands: [],
    registeredViews: [],
    outputLines: [],
    errorMessages,
    callbacks,
    trusted: true,
    warningChoice: options.warningChoice,
    workspaceFolders: [{ uri: { fsPath: '/repo' } }],
  });
  const calls: string[] = [];
  const { activate } = loadExtensionWithDependencyMocks(vscode, calls, () => require('../../src/extension'), {
    target: null,
    coverageResult: options.coverageResult,
  });
  activate(contextFixture() as never);
  await callbacks.get('testInspector.generateCoverage')?.();
  return { calls, errorMessages };
}

function loadExtensionWithDependencyMocks<T>(
  vscode: unknown,
  calls: string[],
  load: () => T,
  options: {
    target?: { repo: { name: string; path: string }; worktree: { path: string; branch: string } } | null;
    coveragePlan?: { planned: unknown[]; skipped: Array<{ label: string }>; skippedSupport: number };
    coverageResult?: { runs: Array<{ projectId: string; command: string; exitCode: number }>; coverage: unknown[] };
    detectedProjects?: unknown[];
  } = {},
): T {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  delete require.cache[require.resolve('../../src/extension')];
  const project = { id: 'node:/repo', rootPath: '/repo', framework: 'node', label: 'Node repo', configFiles: [] };
  const bundle = {
    scanTimestamp: 1,
    projects: [project],
    testFiles: [],
    cases: [],
    totals: { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 },
    runtime: { testCases: 0 },
  };
  const adapter = {
    id: 'node',
    label: 'Node',
    detectProjects: async () => [project],
    discoverTests: async () => [],
    analyzeQuality: async () => [],
    readCoverage: async () => null,
    runFile: async (_project: unknown, filePath: string) => {
      calls.push(`runFile:${filePath}`);
      return { projectId: 'node:/repo', command: 'npm test', exitCode: 0, stdout: 'ok', stderr: '', testFiles: [], startedAt: 1, endedAt: 2 };
    },
    runAll: async () => ({ projectId: 'node:/repo', command: 'npm test', exitCode: 0, stdout: '', stderr: '', testFiles: [], startedAt: 1, endedAt: 2 }),
    runRelated: async () => null,
  };
  class FakeScanner {
    async scan(folders: string[]) {
      calls.push(`scan:${folders.join(',')}`);
      return bundle;
    }
  }
  class FakeTargetController {
    target = options.target === undefined ? {
      repo: { name: 'repo', path: '/repo' },
      worktree: { path: '/repo', branch: 'main' },
    } : options.target;
    featureScope = { kind: 'all', label: 'All features' };
    view = {};
    constructor(private readonly opts: { onPublishBundle: (value: unknown) => void }) {}
    setLatestRawBundle(value: unknown) { return value; }
    async refreshTargets() { calls.push('refreshTargets'); }
    async addRepository() { calls.push('addRepository'); }
    async removeRepository() { calls.push('removeRepository'); }
    async scanTarget() { this.opts.onPublishBundle(bundle); calls.push('scanTarget'); }
    async selectFeatureScope() { calls.push('selectFeatureScope'); }
  }
  class FakeReportsViewProvider {
    static viewType = 'testInspector.reports';
    update() { calls.push('reportUpdate'); }
    focus() { calls.push('reportFocus'); }
  }
  class FakePanel {
    static show() {
      calls.push('panelShow');
      return new FakePanel();
    }
    update() { calls.push('panelUpdate'); }
  }
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'vscode') return vscode;
    if (moduleName === './adapters') return { createAdapters: () => [adapter] };
    if (moduleName === './services/caseFileScanner') {
      return { CaseFileScanner: FakeScanner, detectScannableProjects: async () => ({ projects: options.detectedProjects ?? [project], skippedSupport: 0 }) };
    }
    if (moduleName === './services/coverageController') return coverageControllerMock(calls, project, options.coveragePlan, options.coverageResult);
    if (moduleName === './services/targetController') return { TargetController: FakeTargetController };
    if (moduleName === './services/reportController') return { generateCaseFileReportForSelection: async () => true };
    if (moduleName === './services/aiReviewController') return { createAiReviewer: () => async () => ({ status: 'error', reviewedAt: 1, error: 'unused' }), configureLlm: async () => calls.push('configureLlm') };
    if (moduleName === './services/llm') return { createProviderRegistry: () => new Map() };
    if (moduleName === './services/reviewed') return { ReviewedStore: class { async load() {} async markReviewed(filePath: string) { calls.push(`reviewed:${filePath}`); } } };
    if (moduleName === './views/caseFile/panel') return { CaseFilePanel: FakePanel };
    if (moduleName === './views/casesView') return { CasesTreeProvider: class { update() { calls.push('casesUpdate'); } } };
    if (moduleName === './views/reviewer/panel') return { ReviewerViewProvider: class {} };
    if (moduleName === './views/reports/panel') return { ReportsViewProvider: FakeReportsViewProvider };
    return original(moduleName, parent, isMain);
  };
  try {
    return load();
  } finally {
    loader._load = original;
  }
}

function coverageControllerMock(
  calls: string[],
  project: unknown,
  plan?: { planned: unknown[]; skipped: Array<{ label: string }>; skippedSupport: number },
  result?: { runs: Array<{ projectId: string; command: string; exitCode: number }>; coverage: unknown[] },
) {
  return {
    buildCoveragePlan: async () => plan ?? ({ planned: [project], skipped: [], skippedSupport: 0 }),
    buildCoverageSetupHints: () => [],
    coverageErrorForNoScript: () => ({ message: 'no script', steps: [] }),
    coverageErrorForFailedRun: () => ({ message: 'Coverage failed', steps: [] }),
    coverageErrorForMissingFile: () => ({ message: 'no output file', steps: [] }),
    formatCoveragePreview: () => 'npm run coverage',
    generateCoverageForPlan: async () => {
      calls.push('coverage');
      return result ?? { runs: [{ projectId: 'node:/repo', command: 'npm run coverage', exitCode: 0 }], coverage: [{ projectId: 'node:/repo', files: [], totals: { linesPct: 100 } }] };
    },
  };
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
  errorMessages?: string[];
  callbacks?: Map<string, (...args: unknown[]) => Promise<unknown>>;
  trusted?: boolean;
  workspaceFolders?: Array<{ uri: { fsPath: string } }>;
  warningChoice?: string;
  activeFile?: string;
}) {
  const disposable = { dispose() {} };
  return {
    StatusBarAlignment: { Left: 1 },
    ProgressLocation: { Notification: 1 },
    Uri: { file: (fsPath: string) => ({ fsPath }), joinPath: (uri: { fsPath: string }, ...parts: string[]) => ({ fsPath: [uri.fsPath, ...parts].join('/') }) },
    workspace: {
      isTrusted: opts.trusted ?? false,
      workspaceFolders: opts.workspaceFolders ?? [],
      getConfiguration: () => ({ get: () => undefined, update: async () => {} }),
      asRelativePath: (value: unknown) => String(value),
      fs: { writeFile: async () => {} },
    },
    window: {
      activeTextEditor: opts.activeFile ? { document: { uri: { fsPath: opts.activeFile } } } : undefined,
      createOutputChannel: () => ({ appendLine: (line: string) => opts.outputLines.push(line), dispose() {} }),
      createStatusBarItem: () => ({ show() {}, dispose() {} }),
      registerTreeDataProvider: (viewId: string) => { opts.registeredViews.push(viewId); return disposable; },
      registerWebviewViewProvider: (viewId: string) => { opts.registeredViews.push(viewId); return disposable; },
      showWarningMessage: async (message: string) => { opts.warningMessages?.push(message); return opts.warningChoice; },
      showErrorMessage: async (message: string) => { opts.errorMessages?.push(message); return undefined; },
      showInformationMessage: async (message: string) => { opts.infoMessages?.push(message); return undefined; },
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
    ConfigurationTarget: { Workspace: 1, Global: 2 },
  };
}
