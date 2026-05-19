import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import Module = require('node:module');
import { test } from 'node:test';
import { NodeAdapter } from '../../src/adapters/node';
import {
  buildCoveragePlan,
  coverageErrorForFailedRun,
  coverageErrorForMissingFile,
  coverageErrorForNoScript,
  formatCoveragePreview,
  generateCoverageForPlan,
} from '../../src/services/coverageController';
import { coverageCommandPreview } from '../../src/services/runner';
import { parseLcov } from '../../src/services/coverage';
import type { CoverageSummary, TestProject, TestRunResult } from '../../src/models';
import type { TestFrameworkAdapter } from '../../src/adapters/types';

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

test('coverage controller runs planned projects and reads coverage only after successful runs', async () => {
  const project = projectFixture('node', { id: 'node:/repo', coverageCommand: 'npm run coverage' });
  const coverage: CoverageSummary = {
    projectId: project.id,
    files: [{ path: 'src/a.ts', linesPct: 100, functionsPct: 100, branchesPct: 100 }],
    totals: { linesPct: 100, functionsPct: 100, branchesPct: 100 },
  };
  const { generateCoverageForPlan: generate } = loadCoverageControllerWithRunnerMock([
    runResult(project, 0),
  ]);
  const output: string[] = [];

  const result = await generate([adapterFixture(project.framework, coverage)], [{ project, commands: ['npm run coverage'] }], (line) => output.push(line));

  assert.equal(result.runs.length, 1);
  assert.equal(result.coverage[0], coverage);
  assert.match(output.join('\n'), /\[coverage\] read 1 covered file/);
});

test('coverage controller skips unknown adapters and failed coverage runs safely', async () => {
  const missingAdapterProject = projectFixture('react', { id: 'react:/missing' });
  const failingProject = projectFixture('node', { id: 'node:/fail' });
  const { generateCoverageForPlan: generate } = loadCoverageControllerWithRunnerMock([
    runResult(failingProject, 2),
  ]);

  const result = await generate(
    [adapterFixture('other-framework' as never, undefined), adapterFixture('node', undefined)],
    [
      { project: missingAdapterProject, commands: ['npm run coverage'] },
      { project: failingProject, commands: ['npm run coverage'] },
    ],
  );

  assert.deepEqual(result.skipped.map((project) => project.id), ['react:/missing']);
  assert.equal(result.runs.length, 1);
  assert.equal(result.coverage.length, 0);
});

function projectFixture(framework: TestProject['framework'], overrides: Partial<TestProject> = {}): TestProject {
  return {
    id: `${framework}:/repo`,
    rootPath: '/repo',
    framework,
    label: framework,
    configFiles: [],
    ...overrides,
  };
}

function adapterFixture(id: TestProject['framework'], coverage: CoverageSummary | undefined): TestFrameworkAdapter {
  return {
    id,
    label: id,
    detectProjects: async () => [],
    discoverTests: async () => [],
    runAll: async () => runResult(projectFixture(id), 0),
    runFile: async () => runResult(projectFixture(id), 0),
    runRelated: async () => null,
    readCoverage: async () => coverage ?? null,
    analyzeQuality: async () => [],
  };
}

function runResult(project: TestProject, exitCode: number): TestRunResult {
  return {
    projectId: project.id,
    command: 'npm run coverage',
    exitCode,
    stdout: '',
    stderr: '',
    testFiles: [],
    startedAt: 1,
    endedAt: 2,
  };
}

// ---------------------------------------------------------------------------
// coverageErrorForNoScript
// ---------------------------------------------------------------------------

test('coverageErrorForNoScript returns message with project label and framework-specific steps for node', () => {
  const err = coverageErrorForNoScript([projectFixture('node', { label: 'My API' })]);
  assert.match(err.message, /My API/);
  assert.match(err.message, /node/);
  assert.ok(err.steps.some((s) => /jest/.test(s) || /vitest/.test(s) || /c8/.test(s)));
});

test('coverageErrorForNoScript returns react-specific steps', () => {
  const err = coverageErrorForNoScript([projectFixture('react', { label: 'Web app' })]);
  assert.match(err.message, /Web app/);
  assert.ok(err.steps.some((s) => /react-scripts/.test(s) || /jest/.test(s)));
});

test('coverageErrorForNoScript returns django-specific steps', () => {
  const err = coverageErrorForNoScript([projectFixture('django', { label: 'Backend' })]);
  assert.ok(err.steps.some((s) => /manage\.py/.test(s) || /coverage/.test(s)));
});

test('coverageErrorForNoScript returns fastapi-specific steps', () => {
  const err = coverageErrorForNoScript([projectFixture('fastapi', { label: 'API' })]);
  assert.ok(err.steps.some((s) => /pytest/.test(s)));
});

test('coverageErrorForNoScript handles multiple skipped projects', () => {
  const err = coverageErrorForNoScript([
    projectFixture('node', { label: 'Server' }),
    projectFixture('react', { label: 'Client' }),
  ]);
  assert.match(err.message, /Server/);
  assert.match(err.message, /Client/);
  assert.ok(err.steps.length >= 2);
});

// ---------------------------------------------------------------------------
// coverageErrorForFailedRun
// ---------------------------------------------------------------------------

test('coverageErrorForFailedRun with stderr shows snippet in steps', () => {
  const err = coverageErrorForFailedRun([{
    projectId: 'node:/repo/my-app',
    exitCode: 1,
    stdout: '',
    stderr: 'Error: Cannot find module "jest"\n  at Object.<anonymous>\n  at Module._resolveFilename',
  }]);
  assert.match(err.message, /my-app/);
  assert.ok(err.steps.some((s) => /Cannot find module/.test(s)));
});

test('coverageErrorForFailedRun with no output produces actionable unknown-cause message', () => {
  const err = coverageErrorForFailedRun([{
    projectId: 'node:/repo/my-app',
    exitCode: 1,
    stdout: '',
    stderr: '',
  }]);
  assert.match(err.message, /my-app/);
  assert.ok(err.steps.some((s) => /npm run coverage/.test(s) || /terminal/.test(s)));
});

test('coverageErrorForFailedRun strips long path from project id for readability', () => {
  const err = coverageErrorForFailedRun([{
    projectId: 'node:/Users/danil/projects/very-long-path/my-project',
    exitCode: 2,
    stdout: '',
    stderr: '',
  }]);
  assert.match(err.message, /my-project/);
  assert.doesNotMatch(err.message, /Users\/danil/);
});

// ---------------------------------------------------------------------------
// coverageErrorForMissingFile
// ---------------------------------------------------------------------------

test('coverageErrorForMissingFile message explains no output file was found', () => {
  const err = coverageErrorForMissingFile();
  assert.match(err.message, /report file|output file|no report/i);
  assert.ok(err.steps.some((s) => /lcov|coverage-summary|xml/.test(s)));
  assert.ok(err.steps.some((s) => /terminal|manually/.test(s)));
});

function loadCoverageControllerWithRunnerMock(runs: TestRunResult[]): typeof import('../../src/services/coverageController') {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  const resolved = require.resolve('../../src/services/coverageController');
  delete require.cache[resolved];
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === './runner') {
      return {
        coverageCommandPreview,
        runCoverage: async () => runs.shift() ?? runResult(projectFixture('node'), 0),
      };
    }
    return original(moduleName, parent, isMain);
  };
  try {
    return require('../../src/services/coverageController') as typeof import('../../src/services/coverageController');
  } finally {
    loader._load = original;
  }
}
