import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderReportsHtml } from '../../src/views/reports/template';
import type { CaseFileBundle } from '../../src/services/caseFile';

test('reports template shows a visible deterministic mode selection', () => {
  const html = renderReportsHtml(
    {
      bundle: bundleFixture(),
    },
    { nonce: 'nonce-test', cspSource: 'vscode-resource:' },
  );

  assert.match(html, /data-mode="deterministic" class="active" aria-pressed="true"/);
  assert.match(html, /data-mode="ai" aria-pressed="false"/);
  assert.match(html, /background: var\(--vscode-button-background\)/);
  assert.match(html, /box-shadow: inset 0 0 0 1px var\(--vscode-focusBorder\)/);
  assert.match(html, /item\.setAttribute\('aria-pressed', active \? 'true' : 'false'\)/);
});

test('reports template defaults actionable groups without selecting strong cases', () => {
  const html = renderReportsHtml(
    {
      bundle: bundleFixture(),
    },
    { nonce: 'nonce-test', cspSource: 'vscode-resource:' },
  );

  assert.match(html, /value="MISSING" checked/);
  assert.match(html, /value="STRONG" /);
  assert.doesNotMatch(html, /value="STRONG" checked/);
});

function bundleFixture(): CaseFileBundle {
  return {
    scanTimestamp: 1,
    scope: { featureLabel: 'All features' },
    testFiles: [{ path: '/repo/test/report.test.ts', projectId: 'node:/repo', status: 'unknown', testCases: [], qualityFindings: [] }],
    cases: [
      {
        target: { kind: 'source', path: '/repo/src/reportController.ts', projectId: 'node:/repo' },
        verdict: 'MISSING',
        killPriority: 60,
        story: { headline: 'reportController.ts missing', paragraph: 'No related tests.' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'add', text: 'Add report tests.' },
      },
      {
        target: { kind: 'test', path: '/repo/test/report.test.ts', projectId: 'node:/repo' },
        verdict: 'STRONG',
        killPriority: 0,
        story: { headline: 'report.test.ts', paragraph: 'Healthy.' },
        evidence: { signals: [], relatedTests: [] },
        suggestion: { kind: 'ignore', text: 'No action.' },
      },
    ],
    totals: { THEATER: 0, WEAK: 0, MISSING: 1, STRONG: 1, OK: 0 },
  };
}
