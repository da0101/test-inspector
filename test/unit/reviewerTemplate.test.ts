import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderReviewerHtml } from '../../src/views/reviewer/template';

test('reviewer template renders disabled, ready, and escaped provider state', () => {
  const html = renderReviewerHtml(
    {
      activeProvider: 'gemini',
      activeModel: 'gemini-test',
      configuredProviders: ['gemini'],
      providers: [
        { id: 'gemini', displayName: 'Gemini <fast>', defaultModel: 'gemini-default', suggestedModels: ['gemini-test'] },
        { id: 'openai', displayName: 'OpenAI', defaultModel: 'gpt-default', suggestedModels: ['gpt-default'] },
      ],
      lastTest: { ok: true, message: 'connection <ok>', at: 1 },
    },
    { nonce: 'nonce-test', cspSource: 'vscode-resource:' },
  );

  assert.match(html, /status-ok/);
  assert.match(html, /Gemini &lt;fast&gt;/);
  assert.match(html, /connection &lt;ok&gt;/);
  assert.match(html, /value="gemini" selected/);
  assert.match(html, /acquireVsCodeApi/);
});
