import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';
import { createAdapters } from '../../src/adapters';
import type { TestProject } from '../../src/models';
import { findFlutterSmells } from '../../src/services/qualityFlutter';

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

test('flutter-quality · ignores widget tests with user interaction or unparsable bodies', () => {
  const project = flutterProjectFixture();
  const content = [
    "testWidgets('submits login form', (tester) async {",
    "  await tester.pumpWidget(LoginForm());",
    "  await tester.enterText(find.byType(TextField), 'dan');",
    "  await tester.tap(find.text('Submit'));",
    "  expect(find.text('Saved'), findsOneWidget);",
    "});",
    "testWidgets('missing body', (tester) async",
  ].join('\n');

  const findings = findFlutterSmells(project, '/repo/test/login_test.dart', content);

  assert.equal(findings.some((finding) => finding.kind === 'weak-test'), false);
});

test('flutter-quality · catches mock-only verify tests without behavior assertions', () => {
  const project = flutterProjectFixture();
  const content = [
    "test('notifies repository', () {",
    "  verify(() => repo.save()).called(1);",
    "  verifyNever(() => repo.delete());",
    "});",
  ].join('\n');

  const findings = findFlutterSmells(project, '/repo/test/repo_test.dart', content);

  assert.ok(findings.some((finding) => finding.kind === 'weak-test' && /Mock-only/.test(finding.message)));
});

function flutterProjectFixture(): TestProject {
  return {
    id: 'flutter:/repo',
    rootPath: '/repo',
    framework: 'flutter',
    label: 'Flutter app',
    configFiles: [],
  };
}
