import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildUserPrompt, enrichCase, validateExplanation } from '../../src/services/llm/enrich';
import type { CaseFile } from '../../src/services/caseFile';
import type { LlmProvider } from '../../src/services/llm/types';

function makeCase(): CaseFile {
  return {
    target: { kind: 'test', path: '/repo/foo.test.ts', projectId: 'p1' },
    verdict: 'THEATER',
    killPriority: 90,
    story: { headline: 'foo.test.ts — 2 weak signals', paragraph: '...' },
    evidence: {
      signals: [
        { name: 'trivial-assertion', weight: 30, detail: 'expect(x).toBe(x)', location: { file: '/repo/foo.test.ts', line: 12 } },
      ],
      relatedTests: [],
      gaps: [
        {
          title: 'foo.ts: failure path needs a test',
          severity: 'important',
          reason: 'Branch coverage is low.',
          evidence: ['40% branches coverage'],
          suggestedTest: 'Add an error-path test.',
        },
      ],
    },
    suggestion: { kind: 'delete', text: 'Delete and rewrite' },
  };
}

const FILE_CONTENT = [
  "import Foo from './foo';",
  "",
  "test('should work', () => {",
  "  expect(true).toBe(true);",
  "  expect(Foo).toBeDefined();",
  "});",
].join('\n');

test('llm-enrich · prompt includes verdict, signals, and numbered file content', () => {
  const prompt = buildUserPrompt({ caseFile: makeCase(), fileContent: FILE_CONTENT });
  assert.match(prompt, /VERDICT: THEATER/);
  assert.match(prompt, /trivial-assertion/);
  assert.match(prompt, /DETERMINISTIC TEST GAPS/);
  assert.match(prompt, /failure path needs a test/);
  assert.match(prompt, /^1: import Foo/m);
  assert.match(prompt, /^4:\s+expect\(true\)/m);
});

test('llm-enrich · validator accepts anchors whose excerpt actually appears at the cited line', () => {
  const raw = JSON.stringify({
    verdictAlignsWithEvidence: true,
    explanation: 'Tautological.',
    evidenceAnchors: [{ lineNumber: 4, excerpt: 'expect(true).toBe(true)', issue: 'always true' }],
    suggestedFix: { summary: 'Replace with a real behavior assertion.' },
  });
  const out = validateExplanation(raw, FILE_CONTENT);
  assert.ok(out);
  assert.equal(out.explanation.evidenceAnchors.length, 1);
  assert.equal(out.droppedAnchors, 0);
});

test('llm-enrich · validator DROPS anchors when the line number is out of range', () => {
  const raw = JSON.stringify({
    verdictAlignsWithEvidence: true,
    explanation: 'X',
    evidenceAnchors: [{ lineNumber: 999, excerpt: 'expect(true).toBe(true)', issue: 'fake' }],
    suggestedFix: { summary: 'X' },
  });
  const out = validateExplanation(raw, FILE_CONTENT);
  assert.ok(out);
  assert.equal(out.explanation.evidenceAnchors.length, 0);
  assert.equal(out.droppedAnchors, 1);
});

test('llm-enrich · validator DROPS anchors when the excerpt is fabricated', () => {
  const raw = JSON.stringify({
    verdictAlignsWithEvidence: true,
    explanation: 'X',
    evidenceAnchors: [{ lineNumber: 4, excerpt: 'completelyFabricatedFunction()', issue: 'fake' }],
    suggestedFix: { summary: 'X' },
  });
  const out = validateExplanation(raw, FILE_CONTENT);
  assert.ok(out);
  assert.equal(out.explanation.evidenceAnchors.length, 0);
  assert.equal(out.droppedAnchors, 1);
});

test('llm-enrich · validator returns null when response is not JSON', () => {
  const out = validateExplanation('I think the test is bad because it uses true.', FILE_CONTENT);
  assert.equal(out, null);
});

test('llm-enrich · validator strips ```json``` code fences before parsing', () => {
  const raw = '```json\n' + JSON.stringify({
    verdictAlignsWithEvidence: true,
    explanation: 'X',
    evidenceAnchors: [],
    suggestedFix: { summary: 'X' },
  }) + '\n```';
  const out = validateExplanation(raw, FILE_CONTENT);
  assert.ok(out);
});

test('llm-enrich · validator preserves uncertaintyNotes when present', () => {
  const raw = JSON.stringify({
    verdictAlignsWithEvidence: false,
    explanation: 'I am unsure.',
    evidenceAnchors: [],
    suggestedFix: { summary: 'Investigate first.' },
    uncertaintyNotes: 'Source file not provided, cannot verify what is being tested.',
  });
  const out = validateExplanation(raw, FILE_CONTENT);
  assert.ok(out);
  assert.equal(out.explanation.verdictAlignsWithEvidence, false);
  assert.match(out.explanation.uncertaintyNotes ?? '', /Source file not provided/);
});

test('llm-enrich · validator extracts JSON from surrounding prose and normalizes optional fix fields', () => {
  const raw = `Here is the review:\n${JSON.stringify({
    verdictAlignsWithEvidence: true,
    explanation: 'Evidence matches.',
    evidenceAnchors: [{ lineNumber: 5, excerpt: 'expect(Foo).toBeDefined()', issue: 'only checks existence' }],
    suggestedFix: { summary: '', pseudocode: 'test real behavior' },
  })}`;

  const out = validateExplanation(raw, FILE_CONTENT);

  assert.ok(out);
  assert.equal(out.explanation.evidenceAnchors.length, 1);
  assert.equal(out.explanation.suggestedFix.summary, 'No fix suggested.');
  assert.equal(out.explanation.suggestedFix.pseudocode, 'test real behavior');
});

test('llm-enrich · validator salvages truncated JSON explanation without anchors', () => {
  const out = validateExplanation(
    '{"verdictAlignsWithEvidence": true, "explanation": "The static finding is plausible because the test only proves setup.", "evidenceAnchors": [}',
    FILE_CONTENT,
  );

  assert.ok(out);
  assert.equal(out.explanation.verdictAlignsWithEvidence, true);
  assert.equal(out.explanation.evidenceAnchors.length, 0);
  assert.match(out.explanation.uncertaintyNotes ?? '', /truncated/);
});

test('llm-enrich · validator drops malformed anchors and anchors without an issue', () => {
  const raw = JSON.stringify({
    verdictAlignsWithEvidence: true,
    explanation: 'Some anchors are malformed.',
    evidenceAnchors: [
      'not an object',
      { lineNumber: 4, excerpt: '', issue: 'empty excerpt' },
      { lineNumber: 4, excerpt: 'expect(true).toBe(true)', issue: '' },
      { lineNumber: 4, excerpt: 'expect(true).toBe(true)', issue: 'real anchor' },
    ],
    suggestedFix: {},
  });

  const out = validateExplanation(raw, FILE_CONTENT);

  assert.ok(out);
  assert.equal(out.explanation.evidenceAnchors.length, 1);
  assert.equal(out.droppedAnchors, 3);
});

test('llm-enrich · enrichCase returns grounded review metadata when provider succeeds', async () => {
  const provider = providerFixture(JSON.stringify({
    verdictAlignsWithEvidence: true,
    explanation: 'The verdict is supported.',
    evidenceAnchors: [{ lineNumber: 4, excerpt: 'expect(true).toBe(true)', issue: 'tautology' }],
    suggestedFix: { summary: 'Assert observable behavior.' },
  }));

  const out = await enrichCase(provider, { caseFile: makeCase(), fileContent: FILE_CONTENT });

  assert.equal(out.ok, true);
  if (out.ok) {
    assert.equal(out.provider, 'Mock LLM');
    assert.equal(out.model, 'mock-model');
    assert.equal(out.explanation.evidenceAnchors.length, 1);
  }
});

test('llm-enrich · enrichCase preserves provider failures and reports invalid JSON previews', async () => {
  const failed = await enrichCase({
    ...providerFixture('unused'),
    complete: async () => ({ ok: false as const, error: 'provider down' }),
  }, { caseFile: makeCase(), fileContent: FILE_CONTENT });
  const invalid = await enrichCase(providerFixture('not json'), { caseFile: makeCase(), fileContent: FILE_CONTENT });

  assert.deepEqual(failed, { ok: false, error: 'provider down' });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.match(invalid.error, /not valid grounded JSON/);
    assert.equal(invalid.rawResponse, 'not json');
  }
});

function providerFixture(text: string): LlmProvider {
  return {
    id: 'openai',
    displayName: 'Mock LLM',
    defaultModel: 'mock-model',
    suggestedModels: ['mock-model'],
    isConfigured: async () => true,
    testConnection: async () => ({ ok: true, text: 'ok', modelUsed: 'mock-model' }),
    complete: async () => ({ ok: true, text, modelUsed: 'mock-model' }),
  };
}
