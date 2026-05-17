import assert from 'node:assert/strict';
import Module = require('node:module');
import * as path from 'node:path';
import { test } from 'node:test';
import type { CaseFileBundle } from '../../src/services/caseFile';

test('report controller falls back to workspace root when multiple project roots are scanned', async () => {
  const defaultUris: string[] = [];
  const { generateCaseFileReportForSelection } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({
      savePath: '/workspace/test-inspector-deterministic-report.md',
      provider: 'none',
      defaultUris,
    }),
  );

  const written = await generateCaseFileReportForSelection({
    bundle: {
      ...bundleFixture(),
      scope: undefined,
      projects: [
        { id: 'node:/repo/a', rootPath: '/repo/a', framework: 'node', label: 'A', configFiles: [] },
        { id: 'node:/repo/b', rootPath: '/repo/b', framework: 'node', label: 'B', configFiles: [] },
      ],
    },
    workspaceRoot: '/workspace',
    registry: new Map(),
    output: outputMock(),
    mode: 'deterministic',
    verdicts: ['MISSING'],
  });

  assert.equal(written, true);
  assert.deepEqual(defaultUris, ['/workspace/test-inspector-deterministic-report.md']);
});

test('report controller rejects AI reports when the selected reviewer has no stored key', async () => {
  const provider = providerFixture({ isConfigured: async () => false });
  const { generateCaseFileReportForSelection } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({ provider: 'openai' }),
  );

  await assert.rejects(
    () => generateCaseFileReportForSelection({
      bundle: bundleFixture(),
      registry: new Map([['openai', provider]]) as never,
      output: outputMock(),
      mode: 'ai',
      verdicts: ['MISSING'],
    }),
    /no API key is stored/,
  );
});

test('report controller writes successful AI review details and includes related source context', async () => {
  const writes: Array<{ path: string; content: string }> = [];
  const progress: string[] = [];
  const prompts: string[] = [];
  const testPath = path.join(process.cwd(), 'test/unit/reportController.test.ts');
  const sourcePath = path.join(process.cwd(), 'src/services/reportController.ts');
  const provider = providerFixture({
    complete: async (input) => {
      prompts.push(input.user);
      return {
        ok: true,
        text: JSON.stringify({
          verdictAlignsWithEvidence: false,
          explanation: 'The deterministic verdict needs human review.',
          evidenceAnchors: [{ lineNumber: 1, excerpt: 'import assert', issue: 'target file reviewed' }],
          suggestedFix: { summary: 'Add a focused branch test.' },
        }),
        modelUsed: 'gpt-test',
      };
    },
  });
  const { generateCaseFileReportForSelection } = loadWithVscodeMock<typeof import('../../src/services/reportController')>(
    '../../src/services/reportController',
    vscodeMock({ provider: 'openai', savePath: '/repo/ai.md', writes }),
  );
  const base = bundleFixture().cases[0]!;
  const bundle: CaseFileBundle = {
    ...bundleFixture(),
    cases: [
      {
        ...base,
        target: { kind: 'test', path: testPath, projectId: 'node:/repo' },
        verdict: 'WEAK',
        evidence: { signals: [], relatedTests: [{ path: path.join(process.cwd(), 'missing-related.ts'), weaknesses: [] }] },
      },
      {
        ...base,
        target: { kind: 'source', path: sourcePath, projectId: 'node:/repo' },
        verdict: 'WEAK',
        evidence: { signals: [], relatedTests: [{ path: testPath, weaknesses: [] }] },
      },
    ],
    totals: { THEATER: 0, WEAK: 2, MISSING: 0, STRONG: 0, OK: 0 },
  };

  const written = await generateCaseFileReportForSelection({
    bundle,
    registry: new Map([['openai', provider]]) as never,
    output: outputMock(),
    mode: 'ai',
    verdicts: ['WEAK'],
    onProgress: (message) => progress.push(message),
  });

  assert.equal(written, true);
  assert.ok(prompts.some((prompt) => /RELATED/.test(prompt) && /src\/services\/reportController\.ts/.test(prompt)));
  assert.match(progress.join('\n'), /reportController\.test\.ts/);
  assert.match(writes[0]!.content, /OpenAI \/ gpt-test: challenged/);
});

function loadWithVscodeMock<T>(request: string, vscode: unknown): T {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const modulePath of [request, '../../src/services/llm', '../../src/services/llm/registry']) {
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
  defaultUris?: string[];
}) {
  return {
    Uri: { file: (fsPath: string) => ({ fsPath }) },
    window: {
      showSaveDialog: async (dialogOpts: { defaultUri?: { fsPath: string } }) => {
        if (dialogOpts.defaultUri) opts.defaultUris?.push(dialogOpts.defaultUri.fsPath);
        return opts.savePath ? { fsPath: opts.savePath } : undefined;
      },
      showInformationMessage: async () => undefined,
      showQuickPick: async () => undefined,
    },
    workspace: {
      asRelativePath: (uri: { fsPath: string }) => uri.fsPath,
      fs: {
        writeFile: async (uri: { fsPath: string }, content: Uint8Array) => {
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
    ],
    totals: { THEATER: 0, WEAK: 0, MISSING: 1, STRONG: 0, OK: 0 },
  };
}
