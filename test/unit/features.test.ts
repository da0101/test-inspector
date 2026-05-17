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

test('ignores low-behavior template style files when ranking source risks', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-node-style-risk-'));
  try {
    await mkdir(path.join(root, 'src', 'views', 'caseFile', 'template'), { recursive: true });
    await mkdir(path.join(root, 'src', 'services'), { recursive: true });
    await writeFile(
      path.join(root, 'src', 'views', 'caseFile', 'template', 'style.ts'),
      "export const STYLE = `.btn { color: var(--vscode-foreground); }`;\n"
    );
    await writeFile(
      path.join(root, 'src', 'services', 'reportController.ts'),
      "export async function generateReport() { if (true) return fetch('/api/report'); }\n"
    );

    const project = { id: `node:${root}`, rootPath: root, framework: 'node' as const, label: 'Node.js project', configFiles: [] };
    const risks = await analyzeSourceRisks([project], [], []);

    assert.deepEqual(
      risks.map((risk) => path.relative(root, risk.path)),
      ['src/services/reportController.ts']
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deprioritizes high-line-coverage template render helpers with related tests', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-template-risk-'));
  try {
    await mkdir(path.join(root, 'src', 'views', 'caseFile', 'template'), { recursive: true });
    await mkdir(path.join(root, 'test', 'unit'), { recursive: true });
    const sourcePath = path.join(root, 'src', 'views', 'caseFile', 'template', 'render.ts');
    const testPath = path.join(root, 'test', 'unit', 'render.test.ts');
    await writeFile(
      sourcePath,
      "export function render(state: 'ready' | 'error') { return state === 'ready' ? '<button>Open</button>' : '<p role=\"alert\">Error</p>'; }\n",
    );
    await writeFile(
      testPath,
      "import { render } from '../../src/views/caseFile/template/render';\ntest('renders ready state', () => { render('ready'); });\n",
    );

    const project = { id: `node:${root}`, rootPath: root, framework: 'node' as const, label: 'Node.js project', configFiles: [] };
    const risks = await analyzeSourceRisks(
      [project],
      [{ path: testPath, projectId: project.id, status: 'unknown', testCases: [], qualityFindings: [] }],
      [{
        projectId: project.id,
        files: [{ path: 'out/src/views/caseFile/template/render.js', linesPct: 95, branchesPct: 45, functionsPct: 100 }],
        totals: { linesPct: 95, branchesPct: 45, functionsPct: 100 },
      }],
    );

    assert.equal(risks.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deprioritizes high-line-coverage view template entry files with related tests', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-view-template-risk-'));
  try {
    await mkdir(path.join(root, 'src', 'views', 'reports'), { recursive: true });
    await mkdir(path.join(root, 'test', 'unit'), { recursive: true });
    const sourcePath = path.join(root, 'src', 'views', 'reports', 'template.ts');
    const testPath = path.join(root, 'test', 'unit', 'reportsTemplate.test.ts');
    await writeFile(
      sourcePath,
      "export function renderReports(mode: 'ai' | 'deterministic') { return mode === 'ai' ? '<button>AI</button>' : '<button>Deterministic</button>'; }\n",
    );
    await writeFile(
      testPath,
      "import { renderReports } from '../../src/views/reports/template';\ntest('renders deterministic mode', () => { renderReports('deterministic'); });\n",
    );

    const project = { id: `node:${root}`, rootPath: root, framework: 'node' as const, label: 'Node.js project', configFiles: [] };
    const risks = await analyzeSourceRisks(
      [project],
      [{ path: testPath, projectId: project.id, status: 'unknown', testCases: [], qualityFindings: [] }],
      [{
        projectId: project.id,
        files: [{ path: 'out/src/views/reports/template.js', linesPct: 99, branchesPct: 45, functionsPct: 100 }],
        totals: { linesPct: 99, branchesPct: 45, functionsPct: 100 },
      }],
    );

    assert.equal(risks.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('treats barrel-imported source files as indirectly related to tests', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-barrel-risk-'));
  try {
    await mkdir(path.join(root, 'src', 'adapters'), { recursive: true });
    await mkdir(path.join(root, 'src', 'services'), { recursive: true });
    await mkdir(path.join(root, 'test', 'unit'), { recursive: true });
    await writeFile(
      path.join(root, 'src', 'adapters', 'react.ts'),
      "export class ReactAdapter { async detectProjects() { if (true) return ['react']; } }\n"
    );
    await writeFile(
      path.join(root, 'src', 'adapters', 'index.ts'),
      "import { ReactAdapter } from './react';\nexport function createAdapters() { return [new ReactAdapter()]; }\n"
    );
    await writeFile(
      path.join(root, 'src', 'services', 'reportController.ts'),
      "export async function generateReport() { if (true) return fetch('/api/report'); }\n"
    );
    const testPath = path.join(root, 'test', 'unit', 'adapters.test.ts');
    await writeFile(
      testPath,
      "import assert from 'node:assert/strict';\nimport { createAdapters } from '../../src/adapters';\ntest('creates adapters', () => { assert.equal(createAdapters().length, 1); });\n"
    );

    const project = { id: `node:${root}`, rootPath: root, framework: 'node' as const, label: 'Node.js project', configFiles: [] };
    const risks = await analyzeSourceRisks(
      [project],
      [{ path: testPath, projectId: project.id, status: 'unknown', testCases: [], qualityFindings: [] }],
      []
    );

    assert.deepEqual(
      risks.map((risk) => path.relative(root, risk.path)),
      ['src/services/reportController.ts']
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('flags critical source risk when line coverage is fine but branch coverage is low', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-branch-risk-'));
  try {
    await mkdir(path.join(root, 'src', 'services'), { recursive: true });
    await mkdir(path.join(root, 'test', 'unit'), { recursive: true });
    const sourcePath = path.join(root, 'src', 'services', 'uploadController.ts');
    const testPath = path.join(root, 'test', 'unit', 'uploadController.test.ts');
    await writeFile(
      sourcePath,
      "export async function upload(file?: File) { if (!file) return { ok: false }; return fetch('/api/upload'); }\n",
    );
    await writeFile(
      testPath,
      "import { upload } from '../../src/services/uploadController';\ntest('uploads file', async () => { await upload({} as File); });\n",
    );

    const project = { id: `node:${root}`, rootPath: root, framework: 'node' as const, label: 'Node.js project', configFiles: [] };
    const risks = await analyzeSourceRisks(
      [project],
      [{ path: testPath, projectId: project.id, status: 'unknown', testCases: [], qualityFindings: [] }],
      [{
        projectId: project.id,
        files: [{ path: 'out/src/services/uploadController.js', linesPct: 82, branchesPct: 40, functionsPct: 100 }],
        totals: { linesPct: 82, branchesPct: 40, functionsPct: 100 },
      }],
    );

    assert.equal(risks.length, 1);
    assert.ok(risks[0]!.findings.some((finding) => finding.message.includes('Low branch coverage')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
