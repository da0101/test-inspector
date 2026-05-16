import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';
import { createAdapters } from '../../src/adapters';

const fixtureRoot = path.resolve(process.cwd(), 'test/fixtures');

test('flutter-quality · catches trivial PODO assertions in LLM-generated tests', async () => {
  const flutter = createAdapters().find((a) => a.id === 'flutter');
  assert.ok(flutter);
  const [project] = await flutter.detectProjects([fixtureRoot]);
  assert.ok(project);
  const tests = await flutter.discoverTests(project);
  const findings = await flutter.analyzeQuality(project, tests);
  const trivials = findings.filter((f) => f.kind === 'trivial-assertion');
  assert.ok(trivials.length >= 2, `expected ≥2 trivial-assertion findings in auth_state_test.dart, got ${trivials.length}`);
});

test('flutter-quality · catches render-only widget tests with no interaction', async () => {
  const flutter = createAdapters().find((a) => a.id === 'flutter');
  assert.ok(flutter);
  const [project] = await flutter.detectProjects([fixtureRoot]);
  assert.ok(project);
  const tests = await flutter.discoverTests(project);
  const findings = await flutter.analyzeQuality(project, tests);
  const renderOnly = findings.filter((f) => f.kind === 'weak-test' && /render-only widget test/i.test(f.message));
  assert.ok(renderOnly.length >= 1, `expected ≥1 render-only widget test finding, got ${renderOnly.length}`);
});
