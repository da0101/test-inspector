import assert from 'node:assert/strict';
import Module = require('node:module');
import { test } from 'node:test';
import { buildChangedFileRisks } from '../../src/services/git';
import type { CoverageSummary, QualityFinding, TestFile, TestProject } from '../../src/models';

test('changed-file risks choose the most specific owning project and related test command', () => {
  const risks = buildChangedFileRisks(
    ['/repo/packages/api/src/users/service.ts'],
    [
      projectFixture('/repo', 'node:/repo'),
      projectFixture('/repo/packages/api', 'fastapi:/repo/packages/api', 'fastapi'),
    ],
    [testFile('/repo/packages/api/tests/users/test_service.py', 'fastapi:/repo/packages/api')],
    [coverageFixture('fastapi:/repo/packages/api', 'src/users/service.ts')],
    [],
  );

  assert.equal(risks[0]!.projectId, 'fastapi:/repo/packages/api');
  assert.deepEqual(risks[0]!.relatedTests, ['/repo/packages/api/tests/users/test_service.py']);
  assert.equal(risks[0]!.recommendedCommand, 'pytest tests/users/test_service.py');
});

test('changed-file risks add missing-test and missing-coverage findings when evidence is absent', () => {
  const existingFinding: QualityFinding = {
    id: 'existing',
    kind: 'weak-test',
    severity: 'warning',
    message: 'weak',
    filePath: '/repo/src/payments.ts',
  };

  const risks = buildChangedFileRisks(
    ['/repo/src/payments.ts'],
    [projectFixture('/repo', 'react:/repo', 'react')],
    [],
    [{ projectId: 'react:/repo', files: [], totals: { linesPct: 0 } }],
    [existingFinding],
  );

  assert.equal(risks[0]!.findings.length, 3);
  assert.equal(risks[0]!.recommendedCommand, 'npm test -- --findRelatedTests src/payments.ts');
});

test('changed-file risks recommend framework commands and handle unknown owners', () => {
  const risks = buildChangedFileRisks(
    ['/repo/lib/auth.dart', '/repo/app/views.py', '/outside/file.ts'],
    [
      projectFixture('/repo', 'flutter:/repo', 'flutter'),
      projectFixture('/repo/app', 'django:/repo/app', 'django'),
    ],
    [
      testFile('/repo/test/auth_test.dart', 'flutter:/repo'),
      testFile('/repo/app/tests/test_views.py', 'django:/repo/app'),
    ],
    [],
    [],
  );

  assert.equal(risks.find((risk) => risk.path.endsWith('auth.dart'))?.recommendedCommand, 'flutter test test/auth_test.dart');
  assert.equal(risks.find((risk) => risk.path.endsWith('views.py'))?.recommendedCommand, 'pytest tests/test_views.py');
  assert.equal(risks.find((risk) => risk.path === '/outside/file.ts')?.recommendedCommand, undefined);
});

test('changed-file risks fall back to project-wide commands when related tests are absent', () => {
  const risks = buildChangedFileRisks(
    ['/repo/lib/cart.dart', '/repo/app/api.py', '/repo/src/server.ts'],
    [
      projectFixture('/repo/lib', 'flutter:/repo/lib', 'flutter'),
      projectFixture('/repo/app', 'fastapi:/repo/app', 'fastapi'),
      projectFixture('/repo/src', 'node:/repo/src', 'node'),
    ],
    [],
    [],
    [],
  );

  assert.equal(risks.find((risk) => risk.projectId === 'flutter:/repo/lib')?.recommendedCommand, 'flutter test');
  assert.equal(risks.find((risk) => risk.projectId === 'fastapi:/repo/app')?.recommendedCommand, 'pytest');
  assert.equal(risks.find((risk) => risk.projectId === 'node:/repo/src')?.recommendedCommand, 'npm test');
});

test('changed-file detection reads git diff/status, supports renames, and filters non-source files', async () => {
  const { getChangedFiles, calls } = loadGitWithExecMock({
    diff: 'src/api.ts\nREADME.md\n',
    status: ' M src/ui.ts\nR  old.ts -> src/new.ts\n?? notes.txt\n',
  });

  const files = await getChangedFiles('/repo');

  assert.deepEqual(files.sort(), ['/repo/src/api.ts', '/repo/src/new.ts', '/repo/src/ui.ts']);
  assert.deepEqual(calls.map((call) => call.args.join(' ')), [
    'diff --name-only HEAD --',
    'status --porcelain=v1',
  ]);
});

test('changed-file detection returns an empty list when git commands fail', async () => {
  const { getChangedFiles } = loadGitWithExecMock({ error: new Error('not a repo') });

  const files = await getChangedFiles('/repo');

  assert.deepEqual(files, []);
});

function projectFixture(rootPath: string, id: string, framework: TestProject['framework'] = 'node'): TestProject {
  return {
    id,
    rootPath,
    framework,
    label: id,
    configFiles: [],
  };
}

function testFile(path: string, projectId: string): TestFile {
  return {
    path,
    projectId,
    status: 'unknown',
    testCases: [],
    qualityFindings: [],
  };
}

function coverageFixture(projectId: string, filePath: string): CoverageSummary {
  return {
    projectId,
    files: [{ path: filePath, linesPct: 90, branchesPct: 80, functionsPct: 100 }],
    totals: { linesPct: 90, branchesPct: 80, functionsPct: 100 },
  };
}

function loadGitWithExecMock(opts: { diff?: string; status?: string; error?: Error }): typeof import('../../src/services/git') & { calls: Array<{ args: string[] }> } {
  const calls: Array<{ args: string[] }> = [];
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  delete require.cache[require.resolve('../../src/services/git')];
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'child_process') {
      return {
        execFile: (_command: string, args: string[], _options: unknown, cb: (error: Error | null, stdout: string) => void) => {
          calls.push({ args });
          if (opts.error) {
            cb(opts.error, '');
            return;
          }
          cb(null, args[0] === 'diff' ? opts.diff ?? '' : opts.status ?? '');
        },
      };
    }
    return original(moduleName, parent, isMain);
  };
  try {
    return { ...(require('../../src/services/git') as typeof import('../../src/services/git')), calls };
  } finally {
    loader._load = original;
  }
}
