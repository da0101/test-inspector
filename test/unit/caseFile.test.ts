import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyBundle, summarize, synthesizeCaseFile } from '../../src/services/caseFile';
import type { TestFile } from '../../src/models';

test('caseFile · empty bundle has zeroed totals across every verdict', async () => {
  const bundle = await synthesizeCaseFile({});
  assert.equal(bundle.cases.length, 0);
  assert.deepEqual(bundle.totals, { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 });
  assert.equal(typeof bundle.scanTimestamp, 'number');
});

test('caseFile · summarize on an empty bundle prompts the user to scan', () => {
  assert.equal(summarize(emptyBundle()), 'No cases yet — click Refresh to scan.');
});

test('caseFile · synthesizeCaseFile carries the project reference when provided', async () => {
  const project = {
    id: 'p1',
    rootPath: '/tmp/proj',
    framework: 'react' as const,
    label: 'web',
    configFiles: ['package.json'],
  };
  const bundle = await synthesizeCaseFile({ project });
  assert.equal(bundle.project, project);
});

test('caseFile · summarize composes a parts-joined headline from non-zero totals', () => {
  const bundle = emptyBundle();
  bundle.cases = [
    {
      target: { kind: 'test', path: '/tmp/proj/a.test.ts', projectId: 'p1' },
      verdict: 'THEATER',
      killPriority: 90,
      story: { headline: 'h', paragraph: 'p' },
      evidence: { signals: [], relatedTests: [] },
      suggestion: { kind: 'delete', text: 's' },
    },
  ];
  bundle.totals.THEATER = 1;
  assert.equal(summarize(bundle), '1 theater');
});

test('caseFile · classifies a mocks-the-unit-under-test test as THEATER with a delete suggestion', async () => {
  const testFile: TestFile = {
    path: '/tmp/proj/src/Login.test.tsx',
    projectId: 'p1',
    testCases: [
      { id: '1', name: 'renders', filePath: '/tmp/proj/src/Login.test.tsx', status: 'unknown' },
    ],
    status: 'unknown',
    qualityFindings: [],
  };
  const content = `import Login from './Login';\njest.mock('./Login');\ntest('renders', () => { expect(jest.fn()).toHaveBeenCalled(); });`;
  const bundle = await synthesizeCaseFile(
    { testFiles: [testFile] },
    async () => content,
  );
  assert.equal(bundle.cases.length, 1);
  assert.equal(bundle.cases[0]!.verdict, 'THEATER');
  assert.equal(bundle.cases[0]!.suggestion.kind, 'delete');
  assert.match(bundle.cases[0]!.story.paragraph, /mocks the unit under test/);
});

test('caseFile · classifies a test with rich behavior assertions as STRONG', async () => {
  const testFile: TestFile = {
    path: '/tmp/proj/src/auth/login.test.ts',
    projectId: 'p1',
    testCases: [
      {
        id: '1',
        name: 'rejects login with invalid password and shows error banner',
        filePath: '/tmp/proj/src/auth/login.test.ts',
        status: 'unknown',
      },
    ],
    status: 'unknown',
    qualityFindings: [],
  };
  const content = `import { login } from './login';\ntest('rejects login with invalid password and shows error banner', async () => {\n  const result = await login('user', 'wrong');\n  expect(result.ok).toBe(false);\n  expect(result.error.code).toBe('INVALID_CREDENTIALS');\n});`;
  const bundle = await synthesizeCaseFile(
    { testFiles: [testFile] },
    async () => content,
  );
  assert.equal(bundle.cases[0]!.verdict, 'STRONG');
  assert.equal(bundle.cases[0]!.suggestion.kind, 'review');
});

test('caseFile · classifies a critical source file with no related tests as MISSING with an add suggestion', async () => {
  const bundle = await synthesizeCaseFile({
    sourceRisks: [
      {
        path: '/repo/src/auth/login.ts',
        projectId: 'p1',
        relatedTests: [],
        findings: [],
        score: 75,
        criticality: 35,
        signals: ['auth', 'API/data flow'],
        recommendation: 'Add tests covering the auth boundary and error paths.',
      },
    ],
  });
  assert.equal(bundle.cases.length, 1);
  assert.equal(bundle.cases[0]!.verdict, 'MISSING');
  assert.equal(bundle.cases[0]!.suggestion.kind, 'add');
  assert.match(bundle.cases[0]!.story.paragraph, /no test file imports it/);
  assert.ok(bundle.cases[0]!.evidence.gaps?.length);
  assert.match(bundle.cases[0]!.suggestion.text, /Start with:/);
});

test('caseFile · does not emit a source-file card for non-critical files', async () => {
  const bundle = await synthesizeCaseFile({
    sourceRisks: [
      {
        path: '/repo/src/utils/format.ts',
        projectId: 'p1',
        relatedTests: [],
        findings: [],
        score: 30,
        criticality: 0,
        signals: [],
        recommendation: '',
      },
    ],
  });
  assert.equal(bundle.cases.length, 0);
});

test('caseFile · sorts cases by kill priority (most attention first)', async () => {
  const theater: TestFile = {
    path: '/tmp/proj/src/Theater.test.tsx',
    projectId: 'p1',
    testCases: [{ id: '1', name: 'works', filePath: '/tmp/proj/src/Theater.test.tsx', status: 'unknown' }],
    status: 'unknown',
    qualityFindings: [],
  };
  const strong: TestFile = {
    path: '/tmp/proj/src/Strong.test.tsx',
    projectId: 'p1',
    testCases: [
      {
        id: '2',
        name: 'returns 404 when the user is unknown',
        filePath: '/tmp/proj/src/Strong.test.tsx',
        status: 'unknown',
      },
    ],
    status: 'unknown',
    qualityFindings: [],
  };
  const reader = async (p: string): Promise<string> =>
    p.endsWith('Theater.test.tsx')
      ? `jest.mock('./Theater');\ntest('works', () => { expect(jest.fn()).toHaveBeenCalled(); });`
      : `import { fetchUser } from './Strong';\ntest('returns 404 when the user is unknown', async () => { const r = await fetchUser('x'); expect(r.status).toBe(404); });`;
  const bundle = await synthesizeCaseFile({ testFiles: [strong, theater] }, reader);
  assert.equal(bundle.cases[0]!.target.path, '/tmp/proj/src/Theater.test.tsx');
  assert.equal(bundle.cases[1]!.target.path, '/tmp/proj/src/Strong.test.tsx');
});
