import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inferTestGaps } from '../../src/services/testGaps';
import type { SourceFileRisk } from '../../src/models';

test('testGaps · infers critical scenario gaps from risky untested API code', () => {
  const gaps = inferTestGaps(makeRisk({
    relatedTests: [],
    coverage: { path: '/repo/src/pdf/upload.ts', linesPct: 0, branchesPct: 0, functionsPct: 0 },
    signals: ['API/data flow', 'async/error handling', 'branching behavior'],
  }));

  assert.ok(gaps.length >= 2);
  assert.equal(gaps[0]!.severity, 'critical');
  assert.match(gaps.map((gap) => gap.title).join('\n'), /core behavior is effectively untested/);
  assert.match(gaps.map((gap) => gap.suggestedTest).join('\n'), /failed response|rejected dependency/);
});

test('testGaps · infers branch gaps when tests exist but branch coverage is low', () => {
  const gaps = inferTestGaps(makeRisk({
    relatedTests: ['/repo/test/upload.test.ts'],
    coverage: { path: '/repo/src/pdf/upload.ts', linesPct: 72, branchesPct: 40, functionsPct: 90 },
    signals: ['branching behavior', 'form/validation logic'],
  }));

  assert.ok(gaps.some((gap) => gap.title.includes('guard/validation cases')));
  assert.ok(gaps.some((gap) => gap.title.includes('alternate branches')));
  assert.ok(gaps.every((gap) => gap.severity !== 'critical'));
});

test('testGaps · gives provider-specific suggestions for LLM adapters', () => {
  const gaps = inferTestGaps(makeRisk({
    path: '/repo/src/services/llm/openai.ts',
    relatedTests: ['/repo/test/unit/llm-openai.test.ts'],
    coverage: { path: '/repo/src/services/llm/openai.ts', linesPct: 84, branchesPct: 62, functionsPct: 60 },
    signals: ['API/data flow', 'permission logic', 'async/error handling', 'branching behavior'],
  }));

  const suggestions = gaps.map((gap) => gap.suggestedTest).join('\n');
  assert.match(suggestions, /non-2xx status/);
  assert.match(suggestions, /missing API key/);
});

test('testGaps · gives VS Code command suggestions for extension activation gaps', () => {
  const gaps = inferTestGaps(makeRisk({
    path: '/repo/src/extension.ts',
    relatedTests: ['/repo/test/unit/extension.test.ts'],
    coverage: { path: '/repo/src/extension.ts', linesPct: 45, branchesPct: 48, functionsPct: 27 },
    signals: ['stateful UI logic', 'async/error handling', 'exported public surface', 'branching behavior'],
  }));

  const suggestions = gaps.map((gap) => gap.suggestedTest).join('\n');
  assert.match(suggestions, /untrusted workspace/);
  assert.match(suggestions, /command registration/);
});

test('testGaps · gives validator-specific suggestions for LLM enrichment gaps', () => {
  const gaps = inferTestGaps(makeRisk({
    path: '/repo/src/services/llm/enrich.ts',
    relatedTests: ['/repo/test/unit/llm-enrich.test.ts'],
    coverage: { path: '/repo/src/services/llm/enrich.ts', linesPct: 69, branchesPct: 55, functionsPct: 82 },
    signals: ['API/data flow', 'form/validation logic', 'async/error handling', 'branching behavior'],
  }));

  const suggestions = gaps.map((gap) => gap.suggestedTest).join('\n');
  assert.match(suggestions, /truncated JSON/);
  assert.match(suggestions, /fenced JSON/);
});

test('testGaps · gives sidebar workflow suggestions for target controller gaps', () => {
  const gaps = inferTestGaps(makeRisk({
    path: '/repo/src/services/targetController.ts',
    relatedTests: ['/repo/test/unit/treeViews.test.ts'],
    coverage: { path: '/repo/src/services/targetController.ts', linesPct: 42, branchesPct: 52, functionsPct: 60 },
    signals: ['stateful UI logic', 'async/error handling', 'branching behavior'],
  }));

  const suggestions = gaps.map((gap) => gap.suggestedTest).join('\n');
  assert.match(suggestions, /catalog refresh/);
  assert.match(suggestions, /worktree selection/);
});

test('testGaps · gives catalog and runner specific suggestions', () => {
  const catalog = inferTestGaps(makeRisk({
    path: '/repo/src/services/workspaceCatalog.ts',
    relatedTests: ['/repo/test/unit/workspaceCatalog.test.ts'],
    coverage: { path: '/repo/src/services/workspaceCatalog.ts', linesPct: 41, branchesPct: 69, functionsPct: 52 },
    signals: ['async/error handling', 'exported public surface', 'branching behavior'],
  })).map((gap) => gap.suggestedTest).join('\n');
  const runner = inferTestGaps(makeRisk({
    path: '/repo/src/services/runner.ts',
    relatedTests: ['/repo/test/unit/runner.test.ts'],
    coverage: { path: '/repo/src/services/runner.ts', linesPct: 77, branchesPct: 50, functionsPct: 60 },
    signals: ['async/error handling', 'exported public surface', 'branching behavior'],
  })).map((gap) => gap.suggestedTest).join('\n');

  assert.match(catalog, /Git failures/);
  assert.match(catalog, /Agentboard candidate precedence/);
  assert.match(runner, /exit non-zero/);
  assert.match(runner, /explicit npm coverage command/);
});

test('testGaps · gives filesystem and panel specific suggestions', () => {
  const fsSuggestions = inferTestGaps(makeRisk({
    path: '/repo/src/utils/fs.ts',
    relatedTests: ['/repo/test/unit/fs.test.ts'],
    coverage: { path: '/repo/src/utils/fs.ts', linesPct: 70, branchesPct: 45, functionsPct: 70 },
    signals: ['async/error handling', 'form/validation logic', 'branching behavior'],
  })).map((gap) => gap.suggestedTest).join('\n');
  const panelSuggestions = inferTestGaps(makeRisk({
    path: '/repo/src/views/reports/panel.ts',
    relatedTests: ['/repo/test/unit/controllersAndPanels.test.ts'],
    coverage: { path: '/repo/src/views/reports/panel.ts', linesPct: 75, branchesPct: 45, functionsPct: 70 },
    signals: ['async/error handling', 'stateful UI logic', 'branching behavior'],
  })).map((gap) => gap.suggestedTest).join('\n');

  assert.match(fsSuggestions, /temporary unreadable\/missing paths/);
  assert.match(panelSuggestions, /webview messages/);
});

function makeRisk(overrides: Partial<SourceFileRisk>): SourceFileRisk {
  return {
    path: '/repo/src/pdf/upload.ts',
    projectId: 'p1',
    relatedTests: [],
    findings: [],
    score: 90,
    criticality: 80,
    signals: [],
    recommendation: 'Add behavior tests.',
    ...overrides,
  };
}
