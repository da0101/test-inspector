import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildUserPrompt, validateExplanation } from '../../src/services/llm/enrich';
import type { CaseFile } from '../../src/services/caseFile';

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
