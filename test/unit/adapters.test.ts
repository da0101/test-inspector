import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { createAdapters } from '../../src/adapters';
import { coverageScriptCommand } from '../../src/adapters/shared';

const fixtureRoot = path.resolve(process.cwd(), 'test/fixtures');

test('detects target framework projects from fixtures', async () => {
  const adapters = createAdapters();
  const projects = (await Promise.all(adapters.map((adapter) => adapter.detectProjects([fixtureRoot])))).flat();
  assert.deepEqual(
    projects.map((project) => project.framework).sort(),
    ['django', 'fastapi', 'firebase-functions', 'flutter', 'react']
  );
});

test('detects this extension as a Node.js test project', async () => {
  const node = createAdapters().find((adapter) => adapter.id === 'node');
  assert.ok(node);
  const projects = await node.detectProjects([process.cwd()]);
  const project = projects.find((item) => item.rootPath === process.cwd());

  assert.ok(project);
  assert.equal(project.framework, 'node');
  assert.equal(project.testCommand, 'npm run test');
  assert.equal(project.coverageCommand, 'npm run coverage');
});

test('Node.js self-scan excludes adapter fixture tests', async () => {
  const node = createAdapters().find((adapter) => adapter.id === 'node');
  assert.ok(node);
  const [project] = await node.detectProjects([process.cwd()]);
  assert.ok(project);
  const tests = await node.discoverTests(project);

  assert.equal(tests.some((item) => item.path.split(path.sep).join('/').includes('/test/fixtures/')), false);
});

test('discovers tests and basic quality findings', async () => {
  const react = createAdapters().find((adapter) => adapter.id === 'react');
  assert.ok(react);
  const [project] = await react.detectProjects([fixtureRoot]);
  const tests = await react.discoverTests(project);
  const findings = await react.analyzeQuality(project, tests);
  assert.equal(tests.length, 1);
  assert.equal(tests[0].testCases.length, 2);
  assert.ok(findings.some((finding) => finding.kind === 'skipped-test'));
});

test('coverage command detection does not fall back to plain test script', () => {
  assert.equal(coverageScriptCommand({ scripts: { test: 'jest --runInBand' } }), undefined);
  assert.equal(coverageScriptCommand({ scripts: { coverage: 'jest --coverage' } }), 'npm run coverage');
  assert.equal(coverageScriptCommand({ scripts: { test: 'jest --coverage --runInBand' } }), 'npm run test');
});

test('Node.js adapter runs a specific test file without Jest-only flags', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-node-run-file-'));
  try {
    await mkdir(path.join(root, 'test'), { recursive: true });
    const testPath = path.join(root, 'test', 'sample.test.js');
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
    await writeFile(
      testPath,
      "const test = require('node:test');\nconst assert = require('node:assert/strict');\ntest('sample passes', () => assert.equal(1, 1));\n"
    );
    const node = createAdapters().find((adapter) => adapter.id === 'node');
    assert.ok(node);
    const [project] = await node.detectProjects([root]);

    const result = await node.runFile(project, testPath);

    assert.equal(result.exitCode, 0);
    assert.match(result.command, /npm run test -- test\/sample\.test\.js/);
    assert.doesNotMatch(result.command, /--json/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
