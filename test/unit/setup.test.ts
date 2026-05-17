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

test('does not report missing coverage file once coverage has been read', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-setup-covered-'));
  try {
    const project = projectFixture(root, { coverageCommand: 'npm run coverage' });
    await mkdir(path.join(root, 'node_modules'));
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'jest', coverage: 'jest --coverage' }, devDependencies: { jest: '^29.0.0' } }));

    const issues = await analyzeSetupIssues(
      [project],
      [testFileFixture(project.id)],
      [{ projectId: project.id, files: [], totals: { linesPct: 100 } }],
    );

    assert.equal(issues.some((issue) => issue.kind === 'missing-coverage-file'), false);
    assert.equal(issues.some((issue) => issue.kind === 'missing-node-modules'), false);
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

test('flags missing test command only when no tests are discovered', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-setup-'));
  try {
    const flutter = projectFixture(root, {
      id: 'flutter:test',
      framework: 'flutter',
      label: 'Flutter app',
      testCommand: undefined,
    });
    const withTests = projectFixture(root, {
      id: 'node:test',
      framework: 'node',
      label: 'Node app',
      testCommand: undefined,
    });

    const issues = await analyzeSetupIssues([flutter, withTests], [testFileFixture(withTests.id)], []);

    assert.equal(issues.filter((issue) => issue.kind === 'missing-test-command').length, 1);
    assert.match(issues[0]!.action, /pubspec\.yaml/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('does not flag missing node_modules when package has no dependencies', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-setup-'));
  try {
    const project = projectFixture(root);
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));

    const issues = await analyzeSetupIssues([project], [testFileFixture(project.id)], []);

    assert.equal(issues.some((issue) => issue.kind === 'missing-node-modules'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('setup issues stay empty for non-JavaScript projects with tests and no coverage command', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-setup-python-'));
  try {
    const project = projectFixture(root, {
      id: 'fastapi:test',
      framework: 'fastapi',
      label: 'FastAPI app',
      testCommand: 'pytest',
    });

    const issues = await analyzeSetupIssues([project], [testFileFixture(project.id)], []);

    assert.deepEqual(issues, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('setup missing node_modules action uses root folder when workspace path is dot', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-setup-root-workspace-'));
  try {
    const project = projectFixture(root, { workspacePath: '.' });
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' }, dependencies: { leftpad: '^1.0.0' } }));

    const issues = await analyzeSetupIssues([project], [testFileFixture(project.id)], []);

    assert.match(issues.find((issue) => issue.kind === 'missing-node-modules')?.action ?? '', new RegExp(path.basename(root)));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('setup missing node_modules action uses package workspace path when present', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-setup-workspace-path-'));
  try {
    const project = projectFixture(root, { workspacePath: 'packages/api' });
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' }, dependencies: { express: '^4.0.0' } }));

    const issues = await analyzeSetupIssues([project], [testFileFixture(project.id)], []);

    assert.match(issues.find((issue) => issue.kind === 'missing-node-modules')?.action ?? '', /packages\/api/);
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
