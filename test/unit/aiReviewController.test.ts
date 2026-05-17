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
  return { appendLine() {} } as unknown as import('vscode').OutputChannel;
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
