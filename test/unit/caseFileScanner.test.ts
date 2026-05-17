import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';
import { createAdapters } from '../../src/adapters';
import type { TestFrameworkAdapter } from '../../src/adapters/types';
import type { TestFile, TestProject } from '../../src/models';
import { CaseFileScanner } from '../../src/services/caseFileScanner';

test('scanner skips support fixture projects when scanning this repo', async () => {
  const output = { lines: [] as string[], appendLine(value: string) { this.lines.push(value); } };
  const scanner = new CaseFileScanner(createAdapters(), output, null);

  const bundle = await scanner.scan([process.cwd()]);
  const projects = bundle.projects ?? [];
  const fixtureProject = projects.find((project) => normalize(project.rootPath).includes('/test/fixtures/'));
  const selfProject = projects.find((project) => project.rootPath === process.cwd());

  assert.equal(fixtureProject, undefined);
  assert.equal(selfProject?.framework, 'node');
  assert.ok(output.lines.some((line) => line.includes('support fixture project')));
});

test('scanner returns an empty scoped bundle when no folders are open', async () => {
  const output = { lines: [] as string[], appendLine(value: string) { this.lines.push(value); } };
  const scanner = new CaseFileScanner([], output, null);

  const bundle = await scanner.scan([], { repoName: 'repo', featureLabel: 'All features' });

  assert.equal(bundle.cases.length, 0);
  assert.equal(bundle.scope?.repoName, 'repo');
  assert.ok(output.lines.some((line) => line.includes('no workspace folders')));
});

test('scanner logs unsupported adapters and discovery failures without failing the full scan', async () => {
  const output = { lines: [] as string[], appendLine(value: string) { this.lines.push(value); } };
  const unsupportedProject = projectFixture('/repo/react', 'react');
  const brokenProject = projectFixture('/repo/node', 'node');
  const adapters: TestFrameworkAdapter[] = [
    {
      ...adapterFixture('node', [unsupportedProject, brokenProject]),
      discoverTests: async () => {
        throw new Error('boom');
      },
    },
  ];
  const scanner = new CaseFileScanner(adapters, output, null);

  const bundle = await scanner.scan(['/repo']);

  assert.equal(bundle.cases.length, 0);
  assert.ok(output.lines.some((line) => line.includes('no adapter for react')));
  assert.ok(output.lines.some((line) => line.includes('error during discovery')));
});

test('scanner keeps discovered test files, logs coverage failures, and hides reviewed cases', async () => {
  const output = { lines: [] as string[], appendLine(value: string) { this.lines.push(value); } };
  const project = projectFixture('/repo/node', 'node');
  const testFile: TestFile = {
    path: '/repo/node/test/api.test.ts',
    projectId: project.id,
    status: 'unknown',
    qualityFindings: [],
    testCases: [{ id: 'case', name: 'proves api', filePath: '/repo/node/test/api.test.ts', status: 'passed' }],
  };
  const adapters: TestFrameworkAdapter[] = [
    {
      ...adapterFixture('node', [project]),
      discoverTests: async () => [testFile],
      readCoverage: async () => {
        throw new Error('missing lcov');
      },
    },
  ];
  const reviewed = { shouldHide: async (filePath: string) => filePath.endsWith('api.test.ts') };
  const scanner = new CaseFileScanner(adapters, output, reviewed as never);

  const bundle = await scanner.scan(['/repo']);

  assert.equal(bundle.testFiles?.length, 1);
  assert.equal(bundle.hiddenReviewedCount, 1);
  assert.equal(bundle.totals.STRONG, 0);
  assert.ok(output.lines.some((line) => line.includes('coverage read failed: missing lcov')));
  assert.ok(output.lines.some((line) => line.includes('hidden as reviewed: 1')));
});

function normalize(value: string): string {
  return value.split(path.sep).join('/');
}

function projectFixture(rootPath: string, framework: TestProject['framework']): TestProject {
  return {
    id: `${framework}:${rootPath}`,
    rootPath,
    framework,
    label: framework,
    configFiles: [],
  };
}

function adapterFixture(id: TestProject['framework'], projects: TestProject[]): TestFrameworkAdapter {
  return {
    id,
    label: id,
    detectProjects: async () => projects,
    discoverTests: async () => [],
    runAll: async () => ({
      projectId: projects[0]?.id ?? id,
      command: 'test',
      exitCode: 0,
      stdout: '',
      stderr: '',
      testFiles: [],
      startedAt: 1,
      endedAt: 2,
    }),
    runFile: async () => ({
      projectId: projects[0]?.id ?? id,
      command: 'test',
      exitCode: 0,
      stdout: '',
      stderr: '',
      testFiles: [],
      startedAt: 1,
      endedAt: 2,
    }),
    runRelated: async () => null,
    readCoverage: async () => null,
    analyzeQuality: async () => [],
  };
}
