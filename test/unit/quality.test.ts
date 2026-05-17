import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import type { TestProject } from '../../src/models';
import { analyzeQuality, testFileFromPath } from '../../src/services/quality';

test('quality · ignores test calls and weak assertions inside string fixtures', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-quality-strings-'));
  try {
    const filePath = path.join(root, 'test', 'unit', 'llm-enrich.test.ts');
    await mkdir(path.dirname(filePath), { recursive: true });
    const content = [
      "import assert from 'node:assert/strict';",
      "const FILE_CONTENT = [",
      `  "test('should work', () => {",`,
      `  "  expect(true).toBe(true);",`,
      `  "  expect(Foo).toBeDefined();",`,
      `  "});",`,
      "].join('\\n');",
      "test('builds a grounded prompt with numbered source', () => {",
      "  assert.match(FILE_CONTENT, /should work/);",
      "});",
    ].join('\n');
    await writeFile(filePath, content);
    const project = nodeProject(root);
    const testFile = testFileFromPath(project, filePath, content);
    const findings = await analyzeQuality(project, [testFile]);

    assert.deepEqual(testFile.testCases.map((item) => item.name), ['builds a grounded prompt with numbered source']);
    assert.equal(findings.some((finding) => finding.kind === 'trivial-assertion'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('quality · recognizes node:assert strict method assertions', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-quality-assert-'));
  try {
    const filePath = path.join(root, 'test', 'unit', 'adapters.test.ts');
    await mkdir(path.dirname(filePath), { recursive: true });
    const content = [
      "import assert from 'node:assert/strict';",
      "test('detects adapters from fixtures', () => {",
      "  assert.deepEqual(['react', 'node'].sort(), ['node', 'react']);",
      "  assert.ok(true);",
      "  assert.equal(1, 1);",
      "});",
    ].join('\n');
    await writeFile(filePath, content);
    const project = nodeProject(root);
    const testFile = testFileFromPath(project, filePath, content);
    const findings = await analyzeQuality(project, [testFile]);

    assert.equal(findings.some((finding) => finding.kind === 'no-assertion'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('quality · recognizes multiline local imports as related source coverage', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-quality-imports-'));
  try {
    const filePath = path.join(root, 'test', 'unit', 'heuristics.test.ts');
    await mkdir(path.dirname(filePath), { recursive: true });
    const content = [
      "import assert from 'node:assert/strict';",
      "import {",
      "  detectMockOnlyAssertions,",
      "  detectVagueTitles,",
      "} from '../../src/services/heuristics';",
      "test('detects vague generated titles', () => {",
      "  assert.ok(detectVagueTitles([{ id: '1', name: 'works', filePath: '/x', status: 'unknown' }]));",
      "});",
    ].join('\n');
    await writeFile(filePath, content);
    const project = nodeProject(root);
    const testFile = testFileFromPath(project, filePath, content);
    const findings = await analyzeQuality(project, [testFile]);

    assert.equal(findings.some((finding) => finding.kind === 'orphan-test'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('quality · treats package.json contract tests as connected to local behavior', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-quality-package-contract-'));
  try {
    const filePath = path.join(root, 'test', 'unit', 'packageContributes.test.ts');
    await mkdir(path.dirname(filePath), { recursive: true });
    const content = [
      "import assert from 'node:assert/strict';",
      "import { readFileSync } from 'node:fs';",
      "test('package contributes refresh command', () => {",
      "  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));",
      "  assert.equal(pkg.contributes.commands[0].command, 'testInspector.refresh');",
      "});",
    ].join('\n');
    await writeFile(filePath, content);
    const project = nodeProject(root);
    const testFile = testFileFromPath(project, filePath, content);
    const findings = await analyzeQuality(project, [testFile]);

    assert.equal(findings.some((finding) => finding.kind === 'orphan-test'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('quality · reports unreadable test files as parse errors', async () => {
  const project = nodeProject('/repo');
  const findings = await analyzeQuality(project, [{
    path: '/repo/test/missing.test.ts',
    projectId: project.id,
    status: 'unknown',
    testCases: [],
    qualityFindings: [],
  }]);

  assert.equal(findings[0]?.kind, 'parse-error');
});

test('quality · detects JavaScript skip/focus patterns outside strings', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-quality-patterns-'));
  try {
    const filePath = path.join(root, 'test', 'unit', 'focused.test.ts');
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, [
      "import { run } from '../../src/run';",
      "describe.only('focused suite', () => {",
      "  test.skip('skipped behavior', () => { expect(run()).toBe('ok'); });",
      "});",
    ].join('\n'));
    const project = nodeProject(root);

    const findings = await analyzeQuality(project, [testFileFromPath(project, filePath, await readFile(filePath, 'utf8'))]);

    assert.deepEqual(findings.map((finding) => finding.kind).sort(), ['focused-test', 'skipped-test']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('quality · flags snapshot-only and render-only React tests', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-quality-react-'));
  try {
    const snapshotPath = path.join(root, 'src', 'Snapshot.test.tsx');
    const renderPath = path.join(root, 'src', 'Render.test.tsx');
    await mkdir(path.dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, [
      "import { Snapshot } from './Snapshot';",
      "test('renders snapshot', () => { expect(Snapshot()).toMatchSnapshot(); });",
    ].join('\n'));
    await writeFile(renderPath, [
      "import { render, screen } from '@testing-library/react';",
      "import { Button } from './Button';",
      "test('renders button', () => { render(<Button />); expect(screen.getByText('Save')).toBeInTheDocument(); });",
    ].join('\n'));
    const project = { ...nodeProject(root), framework: 'react' as const };
    const files = [
      testFileFromPath(project, snapshotPath, await readFile(snapshotPath, 'utf8')),
      testFileFromPath(project, renderPath, await readFile(renderPath, 'utf8')),
    ];

    const findings = await analyzeQuality(project, files);

    assert.ok(findings.some((finding) => finding.kind === 'snapshot-only'));
    assert.ok(findings.some((finding) => finding.kind === 'weak-test'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('quality · applies Python and Flutter assertion rules', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-quality-polyglot-'));
  try {
    const pyPath = path.join(root, 'tests', 'test_api.py');
    const dartPath = path.join(root, 'test', 'widget_test.dart');
    await mkdir(path.dirname(pyPath), { recursive: true });
    await mkdir(path.dirname(dartPath), { recursive: true });
    await writeFile(pyPath, "@pytest.mark.skip\ndef test_api():\n    pass\n");
    await writeFile(dartPath, "testWidgets('renders', (tester) async { await tester.pumpWidget(App()); expect(find.text('A'), findsOneWidget); });\n");
    const pythonProject = { ...nodeProject(root), id: `fastapi:${root}`, framework: 'fastapi' as const };
    const flutterProject = { ...nodeProject(root), id: `flutter:${root}`, framework: 'flutter' as const };

    const pythonFindings = await analyzeQuality(pythonProject, [testFileFromPath(pythonProject, pyPath, await readFile(pyPath, 'utf8'))]);
    const flutterFindings = await analyzeQuality(flutterProject, [testFileFromPath(flutterProject, dartPath, await readFile(dartPath, 'utf8'))]);

    assert.ok(pythonFindings.some((finding) => finding.kind === 'skipped-test'));
    assert.ok(pythonFindings.some((finding) => finding.kind === 'no-assertion'));
    assert.ok(flutterFindings.some((finding) => finding.kind === 'weak-test'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function nodeProject(rootPath: string): TestProject {
  return {
    id: `node:${rootPath}`,
    rootPath,
    framework: 'node',
    label: 'Node.js project',
    configFiles: [],
  };
}
