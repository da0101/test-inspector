import assert from 'node:assert/strict';
import Module = require('node:module');
import * as path from 'node:path';
import { test } from 'node:test';
import type { CaseFile, CaseFileBundle } from '../../src/services/caseFile';
import type { LlmProvider } from '../../src/services/llm';

test('AI reviewer returns an actionable setup error when no provider is selected', async () => {
  const { createAiReviewer } = loadWithVscodeMock<typeof import('../../src/services/aiReviewController')>(
    '../../src/services/aiReviewController',
    vscodeMock({ provider: 'none' }),
  );

  const review = createAiReviewer(new Map() as never, outputMock());
  const result = await review(caseFixture(), bundleFixture());

  assert.equal(result.status, 'error');
  assert.match(result.error, /No AI reviewer selected/);
});

test('AI reviewer asks before sending code and cancels without calling the provider', async () => {
  let completeCalls = 0;
  const provider: LlmProvider = {
    id: 'openai',
    displayName: 'OpenAI',
    defaultModel: 'gpt-test',
    suggestedModels: ['gpt-test'],
    isConfigured: async () => true,
    testConnection: async () => ({ ok: true, text: 'ok', modelUsed: 'gpt-test' }),
    complete: async () => {
      completeCalls++;
      return { ok: false, error: 'should not be called' };
    },
  };
  const { createAiReviewer } = loadWithVscodeMock<typeof import('../../src/services/aiReviewController')>(
    '../../src/services/aiReviewController',
    vscodeMock({ provider: 'openai', warningChoice: undefined }),
  );

  const review = createAiReviewer(new Map([['openai', provider]]) as never, outputMock());
  const result = await review(caseFixture(), bundleFixture());

  assert.equal(result.status, 'error');
  assert.match(result.error, /cancelled/);
  assert.equal(completeCalls, 0);
});

test('AI reviewer returns setup error when selected provider has no key', async () => {
  const provider = providerFixture({
    isConfigured: async () => false,
    complete: async () => ({ ok: false, error: 'should not be called' }),
  });
  const { createAiReviewer } = loadWithVscodeMock<typeof import('../../src/services/aiReviewController')>(
    '../../src/services/aiReviewController',
    vscodeMock({ provider: 'openai', warningChoice: 'Send for review' }),
  );

  const review = createAiReviewer(new Map([['openai', provider]]) as never, outputMock());
  const result = await review(caseFixture(), bundleFixture());

  assert.equal(result.status, 'error');
  assert.match(result.error, /no API key is stored/);
});

test('AI reviewer surfaces provider enrichment errors without changing deterministic verdict', async () => {
  const provider = providerFixture({
    complete: async () => ({ ok: false, error: 'provider failed' }),
  });
  const { createAiReviewer } = loadWithVscodeMock<typeof import('../../src/services/aiReviewController')>(
    '../../src/services/aiReviewController',
    vscodeMock({ provider: 'openai', warningChoice: 'Send for review' }),
  );

  const review = createAiReviewer(new Map([['openai', provider]]) as never, outputMock());
  const result = await review(caseFixture(), bundleFixture());

  assert.equal(result.status, 'error');
  assert.match(result.error, /provider failed/);
});

test('AI reviewer accepts grounded explanations when provider agrees with evidence', async () => {
  const provider = providerFixture({
    complete: async () => ({
      ok: true,
      text: JSON.stringify({
        verdictAlignsWithEvidence: true,
        explanation: 'The deterministic finding is supported by the target file.',
        evidenceAnchors: [{ lineNumber: 1, excerpt: 'import assert', issue: 'target file was sent for review' }],
        suggestedFix: { summary: 'Add a focused error-path test.' },
      }),
      modelUsed: 'gpt-test',
    }),
  });
  const { createAiReviewer } = loadWithVscodeMock<typeof import('../../src/services/aiReviewController')>(
    '../../src/services/aiReviewController',
    vscodeMock({ provider: 'openai', warningChoice: 'Send for review' }),
  );

  const review = createAiReviewer(new Map([['openai', provider]]) as never, outputMock());
  const result = await review(caseFixture(), bundleFixture());

  assert.equal(result.status, 'accepted');
  assert.match(result.explanation, /supported/);
  assert.equal(result.evidenceAnchors.length, 1);
});

test('AI reviewer marks challenged explanations when provider disagrees with evidence', async () => {
  const provider = providerFixture({
    complete: async () => ({
      ok: true,
      text: JSON.stringify({
        verdictAlignsWithEvidence: false,
        explanation: 'The provided file does not support the deterministic verdict.',
        evidenceAnchors: [],
        suggestedFix: { summary: 'Review the deterministic evidence before adding tests.' },
        uncertaintyNotes: 'Related source context is insufficient.',
      }),
      modelUsed: 'gpt-test',
    }),
  });
  const { createAiReviewer } = loadWithVscodeMock<typeof import('../../src/services/aiReviewController')>(
    '../../src/services/aiReviewController',
    vscodeMock({ provider: 'openai', warningChoice: 'Send for review' }),
  );

  const review = createAiReviewer(new Map([['openai', provider]]) as never, outputMock());
  const result = await review(caseFixture(), bundleFixture());

  assert.equal(result.status, 'challenged');
  assert.match(result.uncertaintyNotes ?? '', /insufficient/);
});

test('AI reviewer returns a deterministic error when the target file cannot be read', async () => {
  const provider = providerFixture({
    complete: async () => ({ ok: true, text: '{}', modelUsed: 'gpt-test' }),
  });
  const { createAiReviewer } = loadWithVscodeMock<typeof import('../../src/services/aiReviewController')>(
    '../../src/services/aiReviewController',
    vscodeMock({ provider: 'openai', warningChoice: 'Send for review' }),
  );

  const review = createAiReviewer(new Map([['openai', provider]]) as never, outputMock());
  const result = await review({
    ...caseFixture(),
    target: { kind: 'source', path: path.join(process.cwd(), 'does-not-exist.ts'), projectId: 'node:/repo' },
  }, bundleFixture());

  assert.equal(result.status, 'error');
  assert.match(result.error, /ENOENT|no such file/i);
});

test('configureLlm disables the optional reviewer without touching secrets', async () => {
  const updates: Array<{ key: string; value: unknown }> = [];
  const secrets = fakeSecrets();
  const { configureLlm } = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [{ id: 'none', label: 'Disable AI reviewer' }],
    updates,
  }));

  await configureLlm({ secrets } as unknown as import('vscode').ExtensionContext, outputMock());

  assert.deepEqual(updates, [{ key: 'provider', value: 'none' }]);
  assert.equal(secrets.stored.length, 0);
});

test('configureLlm stores, tests, and reports an API key without writing it to settings', async () => {
  const updates: Array<{ key: string; value: unknown }> = [];
  const secrets = fakeSecrets();
  const provider = providerFixture({
    displayName: 'OpenAI',
    suggestedModels: ['gpt-test'],
    testConnection: async () => ({ ok: true, text: '{"ok":true}', modelUsed: 'gpt-test' }),
  });
  const infoMessages: string[] = [];
  const { configureLlm } = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [
      { id: 'openai', label: 'OpenAI' },
      'gpt-test',
      'Add or replace API key',
    ],
    inputValue: '  sk-secret  ',
    updates,
    infoMessages,
  }), provider);

  await configureLlm({ secrets } as unknown as import('vscode').ExtensionContext, outputMock());

  assert.deepEqual(updates, [
    { key: 'provider', value: 'openai' },
    { key: 'model', value: 'gpt-test' },
  ]);
  assert.deepEqual(secrets.stored, [{ key: 'testInspector.llm.openai.apiKey', value: 'sk-secret' }]);
  assert.match(infoMessages.join('\n'), /reviewer configured/);
});

test('configureLlm deletes stored API keys and surfaces failed connection tests', async () => {
  const deletedSecrets = fakeSecrets();
  const deleteOutput = outputMock();
  const deleteFlow = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [
      { id: 'openai', label: 'OpenAI' },
      undefined,
      'Delete stored API key',
    ],
  }));

  await deleteFlow.configureLlm({ secrets: deletedSecrets } as unknown as import('vscode').ExtensionContext, deleteOutput);
  assert.deepEqual(deletedSecrets.deleted, ['testInspector.llm.openai.apiKey']);
  assert.match(deleteOutput.lines.join('\n'), /deleted OpenAI key/);

  const warningMessages: string[] = [];
  const failedProvider = providerFixture({
    displayName: 'OpenAI',
    suggestedModels: ['gpt-test'],
    testConnection: async () => ({ ok: false, error: 'bad key' }),
  });
  const failedFlow = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [
      { id: 'openai', label: 'OpenAI' },
      undefined,
      'Keep existing key',
    ],
    warningMessages,
  }), failedProvider);

  await failedFlow.configureLlm({ secrets: fakeSecrets() } as unknown as import('vscode').ExtensionContext, outputMock());
  assert.match(warningMessages.join('\n'), /bad key/);
});

function loadWithVscodeMock<T>(request: string, vscode: unknown): T {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const modulePath of [
    request,
    '../../src/services/llm',
    '../../src/services/llm/registry',
  ]) {
    const resolved = require.resolve(modulePath);
    delete require.cache[resolved];
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

function vscodeMock(opts: { provider: string; warningChoice?: string }) {
  return {
    window: {
      showWarningMessage: async () => opts.warningChoice,
    },
    workspace: {
      getConfiguration: () => ({
        get: (key: string) => key === 'provider' ? opts.provider : undefined,
      }),
    },
  };
}

function outputMock() {
  const lines: string[] = [];
  return {
    lines,
    appendLine(line: string) {
      lines.push(line);
    },
  } as unknown as import('vscode').OutputChannel & { lines: string[] };
}

function providerFixture(overrides: Partial<LlmProvider>): LlmProvider {
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

function caseFixture(): CaseFile {
  return {
    target: { kind: 'source', path: path.join(process.cwd(), 'test/unit/aiReviewController.test.ts'), projectId: 'node:/repo' },
    verdict: 'MISSING',
    killPriority: 60,
    story: { headline: 'source missing tests', paragraph: 'No related tests.' },
    evidence: { signals: [], relatedTests: [] },
    suggestion: { kind: 'add', text: 'Add tests.' },
  };
}

function bundleFixture(): CaseFileBundle {
  return {
    scanTimestamp: 1,
    cases: [caseFixture()],
    totals: { THEATER: 0, WEAK: 0, MISSING: 1, STRONG: 0, OK: 0 },
  };
}

function fakeSecrets() {
  return {
    stored: [] as Array<{ key: string; value: string }>,
    deleted: [] as string[],
    async get() {
      return undefined;
    },
    async store(key: string, value: string) {
      this.stored.push({ key, value });
    },
    async delete(key: string) {
      this.deleted.push(key);
    },
    onDidChange: () => ({ dispose() {} }),
  };
}

function vscodeConfigureMock(opts: {
  quickPickResults: unknown[];
  inputValue?: string;
  updates?: Array<{ key: string; value: unknown }>;
  infoMessages?: string[];
  warningMessages?: string[];
}) {
  const picks = [...opts.quickPickResults];
  return {
    ConfigurationTarget: { Workspace: 2 },
    window: {
      showQuickPick: async () => picks.shift(),
      showInputBox: async () => opts.inputValue,
      showInformationMessage: async (message: string) => opts.infoMessages?.push(message),
      showWarningMessage: async (message: string) => opts.warningMessages?.push(message),
    },
    workspace: {
      getConfiguration: () => ({
        get: () => 'none',
        update: async (key: string, value: unknown) => opts.updates?.push({ key, value }),
      }),
    },
  };
}

function loadAiReviewWithLlmMock(
  vscode: unknown,
  provider = providerFixture({ displayName: 'OpenAI', suggestedModels: ['gpt-test'] }),
): typeof import('../../src/services/aiReviewController') {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const modulePath of [
    '../../src/services/aiReviewController',
    '../../src/services/llm',
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'vscode') return vscode;
    if (moduleName === './llm') {
      return {
        PROVIDER_IDS: ['openai'],
        secretKey: (id: string) => `testInspector.llm.${id}.apiKey`,
        createProviderRegistry: () => new Map([['openai', provider]]),
        activeProvider: () => provider,
        enrichCase: async () => ({ ok: false, error: 'not used' }),
      };
    }
    return original(moduleName, parent, isMain);
  };
  try {
    return require('../../src/services/aiReviewController') as typeof import('../../src/services/aiReviewController');
  } finally {
    loader._load = original;
  }
}
