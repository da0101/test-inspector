import assert from 'node:assert/strict';
import { test } from 'node:test';
import { synthesizeCaseFile } from '../../src/services/caseFile';
import type { SourceFileRisk } from '../../src/models';

function risk(coverage: number | undefined, relatedTests: string[] = ['/repo/some.test.ts'], over: Partial<SourceFileRisk> = {}): SourceFileRisk {
  return {
    path: '/repo/lib/auth/login.ts',
    projectId: 'p1',
    relatedTests,
    findings: [],
    score: 70,
    criticality: 35,
    signals: ['auth/session logic', 'branching behavior'],
    recommendation: '',
    coverage: coverage === undefined ? undefined : { path: 'lib/auth/login.ts', linesPct: coverage },
    ...over,
  };
}

test('caseFile-boundary · 4% coverage with related tests → MISSING (effectively untested)', async () => {
  const bundle = await synthesizeCaseFile({ sourceRisks: [risk(4)] });
  assert.equal(bundle.cases.length, 1);
  assert.equal(bundle.cases[0]!.verdict, 'MISSING');
  assert.match(bundle.cases[0]!.story.headline, /effectively untested/i);
});

test('caseFile-boundary · 0% coverage with related tests → MISSING', async () => {
  const bundle = await synthesizeCaseFile({ sourceRisks: [risk(0)] });
  assert.equal(bundle.cases[0]!.verdict, 'MISSING');
});

test('caseFile-boundary · 5% coverage (just above MISSING cutoff) with related tests → WEAK', async () => {
  const bundle = await synthesizeCaseFile({ sourceRisks: [risk(5)] });
  assert.equal(bundle.cases[0]!.verdict, 'WEAK');
});

test('caseFile-boundary · 49% coverage with related tests → WEAK', async () => {
  const bundle = await synthesizeCaseFile({ sourceRisks: [risk(49)] });
  assert.equal(bundle.cases[0]!.verdict, 'WEAK');
});

test('caseFile-boundary · 50% coverage with related tests → no card (covered enough)', async () => {
  const bundle = await synthesizeCaseFile({ sourceRisks: [risk(50)] });
  assert.equal(bundle.cases.length, 0);
});

test('caseFile-boundary · 0% coverage with NO related tests → MISSING with no-related-tests signal', async () => {
  const bundle = await synthesizeCaseFile({ sourceRisks: [risk(0, [])] });
  assert.equal(bundle.cases[0]!.verdict, 'MISSING');
  const names = bundle.cases[0]!.evidence.signals.map((s) => s.name);
  assert.ok(names.includes('no-related-tests'));
});

test('caseFile-boundary · effectively-untested killPriority ≥ 60 (sorts above WEAK)', async () => {
  const bundle = await synthesizeCaseFile({
    sourceRisks: [
      risk(0, [], { path: '/repo/missing.ts', score: 10 }),       // MISSING
      risk(30, undefined, { path: '/repo/weak.ts', score: 10 }),  // WEAK
    ],
  });
  // killPriority comparator sorts MISSING (>=60) above WEAK (>=30).
  assert.equal(bundle.cases[0]!.target.path, '/repo/missing.ts');
  assert.equal(bundle.cases[1]!.target.path, '/repo/weak.ts');
});

test('caseFile-boundary · undefined coverage with related tests → no card (no lowCoverage signal)', async () => {
  const bundle = await synthesizeCaseFile({ sourceRisks: [risk(undefined)] });
  assert.equal(bundle.cases.length, 0);
});

test('caseFile-boundary · non-critical file (criticality 0) is never carded regardless of coverage', async () => {
  const bundle = await synthesizeCaseFile({
    sourceRisks: [risk(0, [], { criticality: 0, signals: [] })],
  });
  assert.equal(bundle.cases.length, 0);
});
