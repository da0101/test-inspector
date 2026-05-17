import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { NodeAdapter } from '../../src/adapters/node';
import { buildCoveragePlan, formatCoveragePreview } from '../../src/services/coverageController';
import { coverageCommandPreview } from '../../src/services/runner';
import { parseLcov } from '../../src/services/coverage';
import type { TestProject } from '../../src/models';

test('coverage controller plans only explicit coverage commands', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-coverage-plan-'));
  try {
    await writeFile(path.join(root, 'package.json'), JSON.stringify({
      scripts: {
        test: 'node --test',
        coverage: 'node --test --experimental-test-coverage',
      },
    }));

    const plan = await buildCoveragePlan([new NodeAdapter()], [root]);

    assert.equal(plan.planned.length, 1);
    assert.equal(plan.skipped.length, 0);
    assert.deepEqual(plan.planned[0]!.commands, ['npm run coverage']);
    assert.match(formatCoveragePreview(plan.planned), /npm run coverage/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('coverage controller skips JavaScript projects without an explicit coverage script', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-no-coverage-plan-'));
  try {
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));

    const plan = await buildCoveragePlan([new NodeAdapter()], [root]);

    assert.equal(plan.planned.length, 0);
    assert.equal(plan.skipped.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('coverage preview supports generated framework commands without guessing', () => {
  assert.deepEqual(coverageCommandPreview(projectFixture('flutter')), ['flutter test --coverage']);
  assert.deepEqual(coverageCommandPreview(projectFixture('fastapi')), [
    'coverage run -m pytest',
    'coverage xml',
    'coverage json',
  ]);
  assert.deepEqual(coverageCommandPreview(projectFixture('node')), []);
});

test('lcov project totals use hit counters instead of unweighted file average', () => {
  const summary = parseLcov(
    [
      'SF:/repo/src/a.ts',
      'LF:100',
      'LH:90',
      'end_of_record',
      'SF:/repo/src/b.ts',
      'LF:1',
      'LH:0',
      'end_of_record',
    ].join('\n'),
    'node:/repo',
    '/repo',
  );

  assert.equal(summary.files[0]!.linesPct, 90);
  assert.equal(summary.files[1]!.linesPct, 0);
  assert.equal(summary.totals.linesPct, 89.1);
});

function projectFixture(framework: TestProject['framework']): TestProject {
  return {
    id: `${framework}:/repo`,
    rootPath: '/repo',
    framework,
    label: framework,
    configFiles: [],
  };
}
