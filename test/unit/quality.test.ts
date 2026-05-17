import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
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

function nodeProject(rootPath: string): TestProject {
  return {
    id: `node:${rootPath}`,
    rootPath,
    framework: 'node',
    label: 'Node.js project',
    configFiles: [],
  };
}
