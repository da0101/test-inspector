import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarize, synthesizeCaseFile } from '../../src/services/caseFile';

test('caseFile · empty bundle has zeroed totals across every verdict', () => {
  const bundle = synthesizeCaseFile({});
  assert.equal(bundle.cases.length, 0);
  assert.deepEqual(bundle.totals, { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 });
  assert.equal(typeof bundle.scanTimestamp, 'number');
});

test('caseFile · summarize on an empty bundle prompts the user to scan', () => {
  const bundle = synthesizeCaseFile({});
  assert.equal(summarize(bundle), 'No cases yet — click Refresh to scan.');
});

test('caseFile · synthesizeCaseFile carries the project reference when provided', () => {
  const project = {
    id: 'p1',
    rootPath: '/tmp/proj',
    framework: 'react' as const,
    label: 'web',
    configFiles: ['package.json'],
  };
  const bundle = synthesizeCaseFile({ project });
  assert.equal(bundle.project, project);
});

test('caseFile · summarize composes a parts-joined headline from non-zero totals', () => {
  const project = {
    id: 'p1',
    rootPath: '/tmp/proj',
    framework: 'react' as const,
    label: 'web',
    configFiles: ['package.json'],
  };
  const bundle = synthesizeCaseFile({ project });
  bundle.cases = [
    {
      target: { kind: 'test', path: '/tmp/proj/a.test.ts', projectId: 'p1' },
      verdict: 'THEATER',
      killPriority: 90,
      story: { headline: 'h', paragraph: 'p' },
      evidence: { signals: [], relatedTests: [] },
      suggestion: { kind: 'review', text: 's' },
    },
  ];
  bundle.totals.THEATER = 1;
  assert.equal(summarize(bundle), '1 theater');
});
