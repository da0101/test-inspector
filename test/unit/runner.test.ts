import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import Module = require('node:module');
import { test } from 'node:test';
import type { TestProject, TestRunResult } from '../../src/models';

test('runner captures stdout, stderr, command, and non-zero exit codes', async () => {
  const { runCommand, calls } = loadRunnerWithSpawnMock({
    stdout: ['hello\n'],
    stderr: ['warn\n'],
    closeCode: 7,
  });

  const result = await runCommand(projectFixture(), 'npm', ['run', 'test'], false);

  assert.equal(result.exitCode, 7);
  assert.equal(result.stdout, 'hello\n');
  assert.equal(result.stderr, 'warn\n');
  assert.equal(result.command, 'npm run test');
  assert.equal(calls[0]!.options.cwd, '/repo');
  assert.equal(calls[0]!.options.shell, false);
});

test('runner turns spawn errors into null exit codes and stderr text', async () => {
  const { runCommand } = loadRunnerWithSpawnMock({
    error: new Error('ENOENT npm'),
  });

  const result = await runCommand(projectFixture(), 'npm', ['missing'], false);

  assert.equal(result.exitCode, null);
  assert.match(result.stderr, /ENOENT npm/);
});

test('runner exposes coverage previews for framework and explicit commands', () => {
  const { coverageCommandPreview } = require('../../src/services/runner') as typeof import('../../src/services/runner');

  assert.deepEqual(coverageCommandPreview(projectFixture({ framework: 'flutter' })), ['flutter test --coverage']);
  assert.deepEqual(coverageCommandPreview(projectFixture({ framework: 'node', coverageCommand: 'npm run coverage' })), ['npm run coverage']);
  assert.deepEqual(coverageCommandPreview(projectFixture({ framework: 'node', coverageCommand: undefined })), []);
});

test('runner merges parsed test files with fallback tests when parser has no files', () => {
  const { mergeRunResults } = require('../../src/services/runner') as typeof import('../../src/services/runner');
  const fallback = [{ path: '/repo/test/a.test.ts', projectId: 'p1', status: 'unknown' as const, testCases: [], qualityFindings: [] }];
  const merged = mergeRunResults(projectFixture(), runResultFixture({ testFiles: [] }), fallback);
  const preserved = mergeRunResults(projectFixture(), runResultFixture({ testFiles: fallback }), []);

  assert.equal(merged.testFiles, fallback);
  assert.equal(preserved.testFiles, fallback);
});

type SpawnScenario = {
  stdout?: string[];
  stderr?: string[];
  closeCode?: number | null;
  error?: Error;
};

function loadRunnerWithSpawnMock(scenario: SpawnScenario): typeof import('../../src/services/runner') & { calls: Array<{ command: string; args: string[]; options: { cwd: string; shell: boolean } }> } {
  const calls: Array<{ command: string; args: string[]; options: { cwd: string; shell: boolean } }> = [];
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  const resolved = require.resolve('../../src/services/runner');
  delete require.cache[resolved];
  const spawn = (command: string, args: string[], options: { cwd: string; shell: boolean }) => {
    calls.push({ command, args, options });
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
      kill: () => void;
    };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {
      child.emit('close', null);
    };
    process.nextTick(() => {
      for (const chunk of scenario.stdout ?? []) child.stdout.emit('data', Buffer.from(chunk));
      for (const chunk of scenario.stderr ?? []) child.stderr.emit('data', Buffer.from(chunk));
      if (scenario.error) child.emit('error', scenario.error);
      else child.emit('close', scenario.closeCode ?? 0);
    });
    return child;
  };
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'child_process') return { spawn };
    return original(moduleName, parent, isMain);
  };
  try {
    return { ...(require('../../src/services/runner') as typeof import('../../src/services/runner')), calls };
  } finally {
    loader._load = original;
  }
}

function projectFixture(overrides: Partial<TestProject> = {}): TestProject {
  return {
    id: 'p1',
    rootPath: '/repo',
    framework: 'node',
    label: 'Node repo',
    configFiles: [],
    testCommand: 'npm run test',
    ...overrides,
  };
}

function runResultFixture(overrides: Partial<TestRunResult>): TestRunResult {
  return {
    projectId: 'p1',
    command: 'npm run test',
    exitCode: 0,
    stdout: '',
    stderr: '',
    testFiles: [],
    startedAt: 1,
    endedAt: 2,
    ...overrides,
  };
}
