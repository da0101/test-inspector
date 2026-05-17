import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseJestLikeJson } from '../../src/services/testResults';
import type { TestProject } from '../../src/models';

test('testResults parses Jest-like JSON with status, duration, failures, and line numbers', () => {
  const stdout = JSON.stringify({
    testResults: [{
      name: '/repo/test/unit/example.test.ts',
      status: 'passed',
      startTime: 100,
      endTime: 160,
      assertionResults: [{
        fullName: 'example handles success',
        status: 'passed',
        duration: 12,
        failureMessages: [],
        location: { line: 42 },
      }],
    }],
  });

  const files = parseJestLikeJson(projectFixture(), stdout);

  assert.equal(files.length, 1);
  assert.equal(files[0]!.status, 'passed');
  assert.equal(files[0]!.durationMs, 60);
  assert.equal(files[0]!.testCases[0]!.name, 'example handles success');
  assert.equal(files[0]!.testCases[0]!.line, 42);
});

test('testResults extracts JSON embedded in reporter noise', () => {
  const stdout = [
    'running tests...',
    JSON.stringify({
      testResults: [{
        name: '/repo/test/unit/noisy.test.ts',
        assertionResults: [{ title: 'falls back to title', status: 'success' }],
      }],
    }),
    'done',
  ].join('\n');

  const files = parseJestLikeJson(projectFixture(), stdout);

  assert.equal(files[0]!.testCases[0]!.status, 'passed');
  assert.equal(files[0]!.testCases[0]!.name, 'falls back to title');
});

test('testResults maps mixed case statuses when the file status is unknown', () => {
  const stdout = JSON.stringify({
    testResults: [{
      name: '/repo/test/unit/mixed.test.ts',
      status: 'unknown',
      assertionResults: [
        { title: 'passes', status: 'passed' },
        { title: 'skips', status: 'skipped' },
      ],
    }],
  });

  const files = parseJestLikeJson(projectFixture(), stdout);

  assert.equal(files[0]!.status, 'mixed');
});

test('testResults uses unknown status for missing or unrecognized test data', () => {
  const stdout = JSON.stringify({
    testResults: [{
      name: '/repo/test/unit/unknown.test.ts',
      assertionResults: [{ status: 'custom-runner-state' }],
    }],
  });

  const files = parseJestLikeJson(projectFixture(), stdout);

  assert.equal(files[0]!.status, 'unknown');
  assert.equal(files[0]!.testCases[0]!.name, 'test 1');
});

test('testResults returns an empty list when stdout has no JSON payload', () => {
  const files = parseJestLikeJson(projectFixture(), 'plain text reporter output');

  assert.deepEqual(files, []);
});

function projectFixture(): TestProject {
  return {
    id: 'node:/repo',
    rootPath: '/repo',
    framework: 'node',
    label: 'Node repo',
    configFiles: [],
  };
}
