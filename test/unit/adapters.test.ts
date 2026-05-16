import assert from 'node:assert/strict';
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
