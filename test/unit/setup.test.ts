import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { TestFile, TestProject } from '../../src/models';
import { analyzeSetupIssues } from '../../src/services/setup';

test('flags a JavaScript project with tests but no explicit coverage script', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-setup-'));
  try {
    const project = projectFixture(root, { coverageCommand: undefined });
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'jest --runInBand' }, devDependencies: { jest: '^29.0.0' } }));
    const issues = await analyzeSetupIssues([project], [testFileFixture(project.id)], []);
    assert.ok(issues.some((issue) => issue.kind === 'missing-coverage-script'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('does not report missing coverage script when coverage command is detected', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-setup-'));
  try {
    const project = projectFixture(root, { coverageCommand: 'npm run coverage' });
    await mkdir(path.join(root, 'node_modules'));
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({ scripts: { test: 'jest --runInBand', coverage: 'jest --coverage' }, devDependencies: { jest: '^29.0.0' } })
    );
    const issues = await analyzeSetupIssues([project], [testFileFixture(project.id)], []);
    assert.equal(issues.some((issue) => issue.kind === 'missing-coverage-script'), false);
    assert.ok(issues.some((issue) => issue.kind === 'missing-coverage-file'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('flags missing node_modules separately from test quality', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-setup-'));
  try {
    const project = projectFixture(root);
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'jest --runInBand' }, devDependencies: { jest: '^29.0.0' } }));
    const issues = await analyzeSetupIssues([project], [testFileFixture(project.id)], []);
    assert.ok(issues.some((issue) => issue.kind === 'missing-node-modules'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function projectFixture(rootPath: string, overrides: Partial<TestProject> = {}): TestProject {
  return {
    id: 'firebase-functions:test',
    rootPath,
    workspacePath: 'functions',
    framework: 'firebase-functions',
    label: 'Firebase functions: functions',
    testCommand: 'npm run test',
    coverageCommand: undefined,
    configFiles: [],
    ...overrides
  };
}

function testFileFixture(projectId: string): TestFile {
  return {
    path: '/tmp/functions/src/index.test.ts',
    projectId,
    testCases: [],
    status: 'unknown',
    qualityFindings: []
  };
}
