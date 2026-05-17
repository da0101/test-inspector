import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CaseFile } from '../../src/services/caseFile';
import { emptyBundle } from '../../src/services/caseFile';
import { exportCaseFileAsMarkdown } from '../../src/services/exportMarkdown';

function makeCase(over: Partial<CaseFile> & Pick<CaseFile, 'target' | 'verdict' | 'killPriority'>): CaseFile {
  return {
    story: { headline: 'h', paragraph: 'p' },
    evidence: { signals: [], relatedTests: [] },
    suggestion: { kind: 'review', text: 's' },
    ...over,
  };
}

test('exportMarkdown · emits H1 title and Summary section with all verdict counts', () => {
  const bundle = emptyBundle();
  bundle.cases = [
    makeCase({ target: { kind: 'test', path: '/repo/a.test.ts', projectId: 'p1' }, verdict: 'THEATER', killPriority: 90 }),
    makeCase({ target: { kind: 'test', path: '/repo/b.test.ts', projectId: 'p1' }, verdict: 'WEAK', killPriority: 60 }),
    makeCase({ target: { kind: 'source', path: '/repo/c.ts', projectId: 'p1' }, verdict: 'MISSING', killPriority: 70 }),
    makeCase({ target: { kind: 'test', path: '/repo/d.test.ts', projectId: 'p1' }, verdict: 'STRONG', killPriority: 10 }),
  ];
  const md = exportCaseFileAsMarkdown(bundle);
  assert.match(md, /^# Test Inspector — Deterministic Report/);
  assert.match(md, /## Summary/);
  assert.match(md, /Theater\*\*: 1/);
  assert.match(md, /Weak\*\*: 1/);
  assert.match(md, /Missing\*\*: 1/);
  assert.match(md, /Strong\*\*: 1/);
});

test('exportMarkdown · groups cases by verdict with counts and renders each case once', () => {
  const bundle = emptyBundle();
  bundle.cases = [
    makeCase({
      target: { kind: 'test', path: '/repo/foo.test.ts', projectId: 'p1' },
      verdict: 'THEATER',
      killPriority: 90,
      story: { headline: 'foo.test.ts — theater', paragraph: 'mocks the unit' },
      suggestion: { kind: 'delete', text: 'Delete this test' },
    }),
    makeCase({
      target: { kind: 'source', path: '/repo/bar.ts', projectId: 'p1' },
      verdict: 'MISSING',
      killPriority: 70,
      story: { headline: 'bar.ts — missing', paragraph: 'no tests' },
      suggestion: { kind: 'add', text: 'Add a test for bar.ts' },
    }),
  ];
  bundle.totals = { THEATER: 1, WEAK: 0, MISSING: 1, STRONG: 0, OK: 0 };

  const md = exportCaseFileAsMarkdown(bundle);
  assert.match(md, /## .*Theater.*\(1\)/);
  assert.match(md, /## .*Missing.*\(1\)/);
  assert.match(md, /Delete this test/);
  assert.match(md, /Add a test for bar\.ts/);
});

test('exportMarkdown · renders evidence signals under each case when present', () => {
  const bundle = emptyBundle();
  bundle.cases = [
    makeCase({
      target: { kind: 'test', path: '/repo/foo.test.ts', projectId: 'p1' },
      verdict: 'THEATER',
      killPriority: 90,
      evidence: {
        signals: [
          { name: 'mocks-unit-under-test', weight: 45, detail: 'mocks foo' },
          { name: 'vague-title', weight: 8, detail: '1 vague title' },
        ],
        relatedTests: [],
      },
    }),
  ];
  const md = exportCaseFileAsMarkdown(bundle);
  assert.match(md, /mocks-unit-under-test.*weight 45.*mocks foo/);
  assert.match(md, /vague-title.*weight 8.*1 vague title/);
});

test('exportMarkdown · renders deterministic suggested test gaps', () => {
  const bundle = emptyBundle();
  bundle.cases = [
    makeCase({
      target: { kind: 'source', path: '/repo/upload.ts', projectId: 'p1' },
      verdict: 'MISSING',
      killPriority: 90,
      evidence: {
        signals: [],
        relatedTests: [],
        gaps: [
          {
            title: 'upload.ts: failure path needs a test',
            severity: 'critical',
            reason: 'Async/API code needs failure coverage.',
            evidence: ['0% branch coverage'],
            suggestedTest: 'Simulate a rejected OCR provider and assert no partial write.',
          },
        ],
      },
    }),
  ];

  const md = exportCaseFileAsMarkdown(bundle);
  assert.match(md, /Suggested test gaps/);
  assert.match(md, /upload\.ts: failure path needs a test/);
  assert.match(md, /Simulate a rejected OCR provider/);
});

test('exportMarkdown · filters selected report groups', () => {
  const bundle = emptyBundle();
  bundle.cases = [
    makeCase({ target: { kind: 'test', path: '/repo/foo.test.ts', projectId: 'p1' }, verdict: 'THEATER', killPriority: 90 }),
    makeCase({ target: { kind: 'source', path: '/repo/bar.ts', projectId: 'p1' }, verdict: 'MISSING', killPriority: 70 }),
  ];

  const md = exportCaseFileAsMarkdown(bundle, { verdicts: ['MISSING'] });
  assert.doesNotMatch(md, /## .*Theater/);
  assert.match(md, /## .*Missing.*\(1\)/);
  assert.match(md, /Included groups.*Missing/);
});

test('exportMarkdown · renders AI report suggestions without changing deterministic title', () => {
  const bundle = emptyBundle();
  bundle.cases = [
    makeCase({
      target: { kind: 'source', path: '/repo/bar.ts', projectId: 'p1' },
      verdict: 'MISSING',
      killPriority: 70,
      aiReview: {
        status: 'accepted',
        provider: 'OpenAI',
        model: 'gpt-test',
        reviewedAt: 1,
        explanation: 'The missing-test verdict is supported.',
        evidenceAnchors: [{ lineNumber: 7, excerpt: 'await uploadPdf()', issue: 'critical path has no test' }],
        suggestedFix: { summary: 'Add a PDF upload error-path test.', pseudocode: 'test("handles OCR failure", async () => {})' },
        droppedAnchors: 0,
      },
    }),
  ];

  const md = exportCaseFileAsMarkdown(bundle, { mode: 'ai', verdicts: ['MISSING'] });
  assert.match(md, /^# Test Inspector — AI Optimized Report/);
  assert.match(md, /AI review:/);
  assert.match(md, /Add a PDF upload error-path test/);
  assert.match(md, /Line 7: critical path has no test/);
});

test('exportMarkdown · renders runtime pass count and coverage summary', () => {
  const bundle = emptyBundle();
  bundle.runtime = { testCases: 107, passed: 107, failed: 0, generatedAt: 1, command: 'npm run coverage' };
  bundle.coverage = [{ projectId: 'p1', files: [{ path: 'src/a.ts', linesPct: 80 }], totals: { linesPct: 78.1, branchesPct: 65, functionsPct: 68.8 } }];
  bundle.projects = [{ id: 'p1', rootPath: '/repo', framework: 'node', label: 'Node repo', configFiles: [] }];

  const md = exportCaseFileAsMarkdown(bundle);

  assert.match(md, /Runtime test result:\*\* 107\/107 passing/);
  assert.match(md, /Average line coverage:\*\* 78\.1%/);
  assert.match(md, /Average branch coverage:\*\* 65%/);
  assert.match(md, /Average function coverage:\*\* 68\.8%/);
  assert.match(md, /\| Node repo \| 78\.1% \| 65% \| 68\.8% \| unknown \| 1 \|/);
});
