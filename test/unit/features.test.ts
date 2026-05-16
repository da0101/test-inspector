import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { analyzeFeatureAreas } from '../../src/services/features';
import { analyzeSourceRisks } from '../../src/services/sourceRisk';

test('scopes feature ids by project for monorepos', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-features-'));
  try {
    const appOne = path.join(root, 'apps', 'one');
    const appTwo = path.join(root, 'apps', 'two');
    await mkdir(path.join(appOne, 'src', 'components', 'auth'), { recursive: true });
    await mkdir(path.join(appTwo, 'src', 'components', 'auth'), { recursive: true });
    await writeFile(path.join(appOne, 'src', 'components', 'auth', 'Login.tsx'), 'export function Login() { return null; }\n');
    await writeFile(path.join(appTwo, 'src', 'components', 'auth', 'Login.tsx'), 'export function Login() { return null; }\n');

    const projects = [
      { id: `react:${appOne}`, rootPath: appOne, framework: 'react' as const, label: 'React app: one', configFiles: [] },
      { id: `react:${appTwo}`, rootPath: appTwo, framework: 'react' as const, label: 'React app: two', configFiles: [] }
    ];
    const areas = await analyzeFeatureAreas(projects, [], [], []);

    assert.equal(areas.length, 2);
    assert.equal(new Set(areas.map((area) => area.id)).size, 2);
    assert.ok(areas.every((area) => area.label === 'components / auth'));
    assert.ok(areas.every((area) => area.id.includes(':components/auth')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('ignores generated Flutter files when ranking source risks', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-flutter-generated-'));
  try {
    await mkdir(path.join(root, 'lib', 'l10n', 'generated'), { recursive: true });
    await mkdir(path.join(root, 'lib', 'providers'), { recursive: true });
    await writeFile(path.join(root, 'lib', 'l10n', 'generated', 'app_localizations.dart'), 'class AppLocalizations {}\n');
    await writeFile(path.join(root, 'lib', 'firebase_options.dart'), 'const firebaseOptions = Object();\n');
    await writeFile(path.join(root, 'lib', 'providers', 'auth_provider.dart'), 'Future<void> login() async { if (true) return; }\n');

    const project = { id: `flutter:${root}`, rootPath: root, framework: 'flutter' as const, label: 'Flutter app', configFiles: [] };
    const risks = await analyzeSourceRisks([project], [], []);

    assert.deepEqual(
      risks.map((risk) => path.relative(root, risk.path)),
      ['lib/providers/auth_provider.dart']
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('maps Flutter lib folders to matching test folders', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-flutter-related-'));
  try {
    await mkdir(path.join(root, 'lib', 'providers'), { recursive: true });
    await mkdir(path.join(root, 'test', 'providers'), { recursive: true });
    const sourcePath = path.join(root, 'lib', 'providers', 'auth_provider.dart');
    const testPath = path.join(root, 'test', 'providers', 'auth_notifier_test.dart');
    await writeFile(sourcePath, 'Future<void> login() async { if (true) return; }\n');
    await writeFile(testPath, "import 'package:flutter_test/flutter_test.dart';\nvoid main() { test('auth works', () {}); }\n");

    const project = { id: `flutter:${root}`, rootPath: root, framework: 'flutter' as const, label: 'Flutter app', configFiles: [] };
    const risks = await analyzeSourceRisks(
      [project],
      [{ path: testPath, projectId: project.id, status: 'unknown', testCases: [], qualityFindings: [] }],
      [{ projectId: project.id, files: [], totals: {} }]
    );

    assert.equal(risks.length, 1);
    assert.deepEqual(risks[0].relatedTests, [testPath]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('detects Firebase Functions feature areas under src folders', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-functions-features-'));
  try {
    await mkdir(path.join(root, 'src', 'auth'), { recursive: true });
    await writeFile(path.join(root, 'src', 'auth', 'onCreateUser.ts'), 'export async function onCreateUser() { if (true) return; }\n');

    const project = { id: `firebase-functions:${root}`, rootPath: root, framework: 'firebase-functions' as const, label: 'Firebase functions', configFiles: [] };
    const risks = await analyzeSourceRisks([project], [], []);
    const areas = await analyzeFeatureAreas([project], [], [], risks);

    assert.equal(areas.length, 1);
    assert.equal(areas[0].label, 'src / auth');
    assert.equal(areas[0].sourceFiles.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
