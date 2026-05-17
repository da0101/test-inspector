import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import type { TestProject } from '../../src/models';
import { parseCoveragePyJson, parseCoveragePyXml, parseLcov, readProjectCoverage, summarizeCoverage } from '../../src/services/coverage';

test('parses lcov line, branch, and function coverage', () => {
  const summary = parseLcov([
    'SF:/repo/src/a.ts',
    'DA:1,1',
    'DA:2,0',
    'LF:2',
    'LH:1',
    'FNF:1',
    'FNH:1',
    'BRF:2',
    'BRH:1',
    'end_of_record',
    '',
  ].join('\n'), 'p', '/repo');

  assert.equal(summary.files[0].path, 'src/a.ts');
  assert.equal(summary.files[0].linesPct, 50);
  assert.equal(summary.files[0].branchesPct, 50);
  assert.deepEqual(summary.files[0].uncoveredLines, [2]);
});

test('lcov parser ignores TypeScript CommonJS helper boilerplate in compiled output', () => {
  const summary = parseLcov([
    'SF:/repo/out/src/services/testController.js',
    'FN:2,anonymous_0',
    'FN:15,__setModuleDefault',
    'FN:47,refresh',
    'FNDA:0,anonymous_0',
    'FNDA:0,__setModuleDefault',
    'FNDA:1,refresh',
    'DA:2,0',
    'DA:15,0',
    'DA:47,1',
    'DA:53,0',
    'BRDA:5,0,0,0',
    'BRDA:15,1,0,0',
    'BRDA:53,2,0,0',
    'BRDA:54,3,0,1',
    'LF:4',
    'LH:1',
    'FNF:3',
    'FNH:1',
    'BRF:4',
    'BRH:1',
    'end_of_record',
  ].join('\n'), 'p', '/repo');

  assert.equal(summary.files[0].path, 'out/src/services/testController.js');
  assert.equal(summary.files[0].linesPct, 50);
  assert.equal(summary.files[0].functionsPct, 100);
  assert.equal(summary.files[0].branchesPct, 50);
  assert.deepEqual(summary.files[0].uncoveredLines, [53]);
});

test('lcov parser counts duplicate function names by occurrence', () => {
  const summary = parseLcov([
    'SF:/repo/src/dupes.ts',
    'FN:1,same',
    'FN:2,same',
    'FNDA:1,same',
    'FNDA:0,same',
    'DA:1,1',
    'DA:2,0',
    'end_of_record',
  ].join('\n'), 'p', '/repo');

  assert.equal(summary.files[0].functionsPct, 50);
});

test('parses coverage.py json and summarizes when totals are absent', () => {
  const summary = parseCoveragePyJson(
    {
      files: {
        'app/main.py': {
          summary: { percent_covered: 75 },
          missing_lines: [10]
        }
      }
    },
    'p'
  );

  assert.equal(summary.totals.linesPct, 75);
  assert.deepEqual(summary.files[0].uncoveredLines, [10]);
});

test('parses coverage.py xml with branch rates and missing line filters', () => {
  const xml = '<coverage><packages><package><classes><class filename="/repo/app/main.py" line-rate="0.5" branch-rate="0.25"><lines><line number="1" hits="1"/><line number="2" hits="0"/><line number="not-a-number" hits="0"/></lines></class></classes></package></packages></coverage>';
  const summary = parseCoveragePyXml(xml, 'p', '/repo');

  assert.equal(summary.files[0].path, 'app/main.py');
  assert.equal(summary.files[0].linesPct, 50);
  assert.equal(summary.files[0].branchesPct, 25);
  assert.deepEqual(summary.files[0].uncoveredLines, [2]);
});

test('summarizes coverage while ignoring unavailable metrics', () => {
  const totals = summarizeCoverage([
    { path: 'a.ts', linesPct: 50, branchesPct: 25 },
    { path: 'b.ts', linesPct: 100, functionsPct: 80 },
  ]);

  assert.deepEqual(totals, { linesPct: 75, branchesPct: 25, functionsPct: 80, statementsPct: undefined });
});

test('reads first supported project coverage file in priority order', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-coverage-read-'));
  try {
    await mkdir(path.join(root, 'coverage'), { recursive: true });
    await writeFile(path.join(root, 'coverage', 'lcov.info'), [
      'SF:/repo/src/a.ts',
      'DA:1,1',
      'LF:1',
      'LH:1',
      'end_of_record',
    ].join('\n'));
    await writeFile(path.join(root, 'coverage.json'), JSON.stringify({ totals: { percent_covered: 10 } }));

    const summary = await readProjectCoverage(projectFixture(root));

    assert.equal(summary?.totals.linesPct, 100);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('reads python json/xml fallbacks and returns null when no coverage exists', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-coverage-fallback-'));
  try {
    await mkdir(path.join(root, 'htmlcov'), { recursive: true });
    await writeFile(path.join(root, 'htmlcov', 'coverage.json'), JSON.stringify({
      totals: { percent_covered: 61 },
      files: {},
    }));
    const jsonSummary = await readProjectCoverage(projectFixture(root));
    assert.equal(jsonSummary?.totals.linesPct, 61);

    await rm(path.join(root, 'htmlcov'), { recursive: true, force: true });
    await writeFile(path.join(root, 'coverage.xml'), '<coverage><packages><package><classes><class filename="app.py" line-rate="1"><lines><line number="1" hits="1"/></lines></class></classes></package></packages></coverage>');
    const xmlSummary = await readProjectCoverage(projectFixture(root));
    assert.equal(xmlSummary?.totals.linesPct, 100);

    await rm(path.join(root, 'coverage.xml'), { force: true });
    assert.equal(await readProjectCoverage(projectFixture(root)), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function projectFixture(rootPath: string): TestProject {
  return {
    id: `node:${rootPath}`,
    rootPath,
    framework: 'node',
    label: 'Node app',
    configFiles: [],
  };
}
