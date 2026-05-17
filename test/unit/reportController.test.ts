import assert from 'node:assert/strict';
import Module = require('node:module');
import * as path from 'node:path';
import { test } from 'node:test';
import type { CaseFileBundle } from '../../src/services/caseFile';

test('report controller writes a deterministic report for selected verdict groups only', async () => {
  const writes: Array<{ path: string; content: string }> = [];
  const vscode = vscodeMock({
    savePath: '/repo/test-inspector-deterministic-report.md',
    writes,
    provider: 'none',
  });
  const { generateCaseFileReportForSelection } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscode,
  );

  const written = await generateCaseFileReportForSelection({
    bundle: bundleFixture(),
    workspaceRoot: '/repo',
    registry: new Map(),
    output: outputMock(),
    mode: 'deterministic',
    verdicts: ['MISSING'],
  });

  assert.equal(written, true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0]!.path, '/repo/test-inspector-deterministic-report.md');
  assert.match(writes[0]!.content, /# Test Inspector — Deterministic Report/);
  assert.match(writes[0]!.content, /Missing source/);
  assert.doesNotMatch(writes[0]!.content, /Strong test/);
});

test('report controller rejects AI reports when no reviewer is configured', async () => {
  const { generateCaseFileReportForSelection } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({ provider: 'none' }),
  );

  await assert.rejects(
    () => generateCaseFileReportForSelection({
      bundle: bundleFixture(),
      registry: new Map(),
      output: outputMock(),
      mode: 'ai',
      verdicts: ['MISSING'],
    }),
    /Configure an AI reviewer/,
  );
});

test('report controller returns false when save dialog is cancelled', async () => {
  const { generateCaseFileReportForSelection } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({ provider: 'none' }),
  );

  const written = await generateCaseFileReportForSelection({
    bundle: bundleFixture(),
    registry: new Map(),
    output: outputMock(),
    mode: 'deterministic',
    verdicts: ['MISSING'],
  });

  assert.equal(written, false);
});

test('report controller propagates write failures', async () => {
  const { generateCaseFileReportForSelection } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({ provider: 'none', savePath: '/repo/report.md', writeError: new Error('disk full') }),
  );

  await assert.rejects(
    () => generateCaseFileReportForSelection({
      bundle: bundleFixture(),
      registry: new Map(),
      output: outputMock(),
      mode: 'deterministic',
      verdicts: ['MISSING'],
    }),
    /disk full/,
  );
});

test('report controller preserves deterministic report when AI review fails', async () => {
  const writes: Array<{ path: string; content: string }> = [];
  const provider = providerFixture({
    complete: async () => ({ ok: false, error: 'ai failed' }),
  });
  const { generateCaseFileReportForSelection } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({ provider: 'openai', savePath: '/repo/test-inspector-ai-report.md', writes }),
  );

  const written = await generateCaseFileReportForSelection({
    bundle: bundleFixture(),
    registry: new Map([['openai', provider]]) as never,
    output: outputMock(),
    mode: 'ai',
    verdicts: ['MISSING'],
  });

  assert.equal(written, true);
  assert.match(writes[0]!.content, /AI Optimized Report/);
  assert.match(writes[0]!.content, /AI review errors:\*\* 1/);
  assert.match(writes[0]!.content, /ai failed/);
  assert.match(writes[0]!.content, /Missing source/);
});

test('report controller interactive flow writes selected groups from quick picks', async () => {
  const writes: Array<{ path: string; content: string }> = [];
  const { generateCaseFileReport } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({
      provider: 'none',
      savePath: '/repo/from-picker.md',
      writes,
      quickPickResults: [
        { mode: 'deterministic' },
        [{ verdict: 'STRONG' }],
      ],
    }),
  );

  await generateCaseFileReport({
    bundle: bundleFixture(),
    workspaceRoot: '/repo',
    registry: new Map(),
    output: outputMock(),
  });

  assert.match(writes[0]!.content, /Strong test/);
  assert.doesNotMatch(writes[0]!.content, /Missing source/);
});

test('report controller interactive flow cancels cleanly for empty bundle or cancelled picks', async () => {
  const infoMessages: string[] = [];
  const { generateCaseFileReport } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({ provider: 'none', infoMessages }),
  );

  await generateCaseFileReport({
    bundle: { scanTimestamp: 1, cases: [], totals: { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 } },
    registry: new Map(),
    output: outputMock(),
  });

  assert.match(infoMessages.join('\n'), /nothing to report/);

  const cancelled = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({ provider: 'none', quickPickResults: [undefined] }),
  );
  await cancelled.generateCaseFileReport({
    bundle: bundleFixture(),
    registry: new Map(),
    output: outputMock(),
  });
});

function loadWithVscodeMock<T>(request: string, vscode: unknown): T {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const modulePath of [
    request,
    '../../src/services/llm',
    '../../src/services/llm/registry',
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'vscode') return vscode;
    return original(moduleName, parent, isMain);
  };
  try {
    return require(request) as T;
  } finally {
    loader._load = original;
  }
}

function vscodeMock(opts: {
  savePath?: string;
  writes?: Array<{ path: string; content: string }>;
  provider: string;
  writeError?: Error;
  quickPickResults?: unknown[];
  infoMessages?: string[];
}) {
  const quickPicks = [...(opts.quickPickResults ?? [])];
  return {
    Uri: { file: (fsPath: string) => ({ fsPath }) },
    window: {
      showSaveDialog: async () => opts.savePath ? { fsPath: opts.savePath } : undefined,
      showInformationMessage: async (message: string) => opts.infoMessages?.push(message),
      showQuickPick: async () => quickPicks.shift(),
    },
    workspace: {
      asRelativePath: (uri: { fsPath: string }) => uri.fsPath,
      fs: {
        writeFile: async (uri: { fsPath: string }, content: Uint8Array) => {
          if (opts.writeError) throw opts.writeError;
          opts.writes?.push({ path: uri.fsPath, content: Buffer.from(content).toString('utf8') });
        },
      },
      getConfiguration: () => ({
        get: (key: string) => key === 'provider' ? opts.provider : undefined,
      }),
    },
  };
}

function outputMock() {
  return { appendLine() {} } as unknown as import('vscode').OutputChannel;
}

function providerFixture(overrides: Partial<import('../../src/services/llm').LlmProvider>) {
  return {
    id: 'openai',
    displayName: 'OpenAI',
    defaultModel: 'gpt-test',
    suggestedModels: ['gpt-test'],
    isConfigured: async () => true,
    testConnection: async () => ({ ok: true, text: 'ok', modelUsed: 'gpt-test' }),
    complete: async () => ({ ok: false, error: 'not implemented' }),
    ...overrides,
  };
}

function bundleFixture(): CaseFileBundle {
  return {
    scanTimestamp: 1,
    projects: [{ id: 'node:/repo', rootPath: '/repo', framework: 'node', label: 'Node repo', configFiles: [] }],
    testFiles: [{ path: '/repo/test/source.test.ts', projectId: 'node:/repo', status: 'unknown', testCases: [], qualityFindings: [] }],
    cases: [
      {
        target: { kind: 'source', path: path.join(process.cwd(), 'test/unit/reportController.test.ts'), projectId: 'node:/repo' },
        verdict: 'MISSING',
        killPriority: 60,
        story: { headline: 'Missing source', paragraph: 'No tests.' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'add', text: 'Add tests.' },
      },
      {
        target: { kind: 'test', path: '/repo/test/source.test.ts', projectId: 'node:/repo' },
        verdict: 'STRONG',
        killPriority: 0,
        story: { headline: 'Strong test', paragraph: 'Healthy.' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'ignore', text: 'No action.' },
      },
    ],
    totals: { THEATER: 0, WEAK: 0, MISSING: 1, STRONG: 1, OK: 0 },
  };
}
