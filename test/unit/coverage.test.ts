import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCoveragePyJson, parseCoveragePyXml, parseLcov } from '../../src/services/coverage';

test('parses lcov line and function coverage', () => {
  const summary = parseLcov(['SF:/repo/src/a.ts', 'DA:1,1', 'DA:2,0', 'LF:2', 'LH:1', 'FNF:1', 'FNH:1', 'end_of_record'].join('\n'), 'p', '/repo');
  assert.equal(summary.files[0].path, 'src/a.ts');
  assert.equal(summary.files[0].linesPct, 50);
  assert.deepEqual(summary.files[0].uncoveredLines, [2]);
});

test('parses coverage.py json', () => {
  const summary = parseCoveragePyJson(
    {
      totals: { percent_covered: 75 },
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

test('parses coverage.py xml', () => {
  const xml = '<coverage><packages><package><classes><class filename="app/main.py" line-rate="0.5"><lines><line number="1" hits="1"/><line number="2" hits="0"/></lines></class></classes></package></packages></coverage>';
  const summary = parseCoveragePyXml(xml, 'p');
  assert.equal(summary.files[0].linesPct, 50);
  assert.deepEqual(summary.files[0].uncoveredLines, [2]);
});
