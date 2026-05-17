import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CaseFileBundle } from '../../src/services/caseFile';
import { buildFeatureScopeOptions, filterCaseBundle } from '../../src/services/featureScope';

test('filters case file bundles by feature query across source and related tests', () => {
  const bundle = fixtureBundle();

  const filtered = filterCaseBundle(bundle, { kind: 'query', label: 'pdf upload', query: 'pdf upload' });

  assert.equal(filtered.cases.length, 1);
  assert.equal(filtered.cases[0].target.path, '/repo/src/features/pdf-upload/service.ts');
  assert.equal(filtered.totals.MISSING, 1);
  assert.equal(filtered.totals.WEAK, 0);
});

test('builds compact feature scope options from common feature folders', () => {
  const options = buildFeatureScopeOptions(fixtureBundle());

  assert.ok(options.some((option) => option.label === 'features / pdf-upload'));
});

function fixtureBundle(): CaseFileBundle {
  return {
    scanTimestamp: 1,
    projects: [{ id: 'react:/repo', rootPath: '/repo', framework: 'react', label: 'React app', configFiles: [] }],
    totals: { THEATER: 0, WEAK: 1, MISSING: 1, STRONG: 0, OK: 0 },
    cases: [
      {
        target: { kind: 'source', path: '/repo/src/features/pdf-upload/service.ts', projectId: 'react:/repo' },
        verdict: 'MISSING',
        killPriority: 80,
        story: { headline: 'PDF upload has no tests', paragraph: 'OCR extraction and REST API call are untested.' },
        evidence: { signals: [], relatedTests: [{ path: '/repo/src/features/pdf-upload/service.test.ts', weaknesses: [] }] },
        suggestion: { kind: 'add', text: 'Add PDF upload workflow tests.' }
      },
      {
        target: { kind: 'test', path: '/repo/src/auth/Login.test.tsx', projectId: 'react:/repo' },
        verdict: 'WEAK',
        killPriority: 20,
        story: { headline: 'Login test is weak', paragraph: 'Only checks render.' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'rewrite', text: 'Drive login behavior.' }
      }
    ]
  };
}
