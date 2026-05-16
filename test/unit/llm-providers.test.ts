import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ClaudeProvider } from '../../src/services/llm/claude';
import { GeminiProvider } from '../../src/services/llm/gemini';
import { OpenAiProvider } from '../../src/services/llm/openai';

// Minimal SecretStorage mock — only get/store/delete are exercised.
class FakeSecrets {
  private map = new Map<string, string>();
  async get(key: string): Promise<string | undefined> { return this.map.get(key); }
  async store(key: string, value: string): Promise<void> { this.map.set(key, value); }
  async delete(key: string): Promise<void> { this.map.delete(key); }
  onDidChange = () => ({ dispose() {} });
}

function ctx(apiKey: string | undefined, key: 'testInspector.llm.openai.apiKey' | 'testInspector.llm.claude.apiKey' | 'testInspector.llm.gemini.apiKey') {
  const fake = new FakeSecrets();
  if (apiKey) void fake.store(key, apiKey);
  return {
    secrets: fake as unknown as import('vscode').SecretStorage,
    getModel: () => undefined as string | undefined,
    getBaseUrlOverride: () => undefined as string | undefined,
  };
}

type HttpCapture = { url: string; headers: Record<string, string>; body?: string; method: string };
function captureHttp(response: { status: number; body: string }): { http: import('../../src/services/llm/http').HttpRequestInit extends infer T ? (init: T) => Promise<typeof response> : never; calls: HttpCapture[] } {
  const calls: HttpCapture[] = [];
  const http = async (init: import('../../src/services/llm/http').HttpRequestInit) => {
    calls.push({ url: init.url, headers: init.headers, body: init.body, method: init.method });
    return response;
  };
  return { http: http as never, calls };
}

// ---------- OpenAI ----------

test('llm-openai · builds chat-completions body with model, messages, response_format', async () => {
  const { http, calls } = captureHttp({
    status: 200,
    body: JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }], model: 'gpt-4o-mini' }),
  });
  const provider = new OpenAiProvider(ctx('sk-test', 'testInspector.llm.openai.apiKey'), http);
  const res = await provider.complete({ system: 'sys', user: 'usr', temperature: 0.2, maxTokens: 100 });
  assert.ok(res.ok);
  assert.equal(res.text, '{"ok":true}');
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(calls[0]!.headers['Authorization'], 'Bearer sk-test');
  const body = JSON.parse(calls[0]!.body ?? '{}');
  assert.equal(body.temperature, 0.2);
  assert.equal(body.max_tokens, 100);
  assert.equal(body.response_format.type, 'json_object');
  assert.equal(body.messages[0].role, 'system');
  assert.equal(body.messages[1].role, 'user');
});

test('llm-openai · returns error on HTTP non-2xx with body slice', async () => {
  const { http } = captureHttp({ status: 429, body: 'rate limited — try again later' });
  const provider = new OpenAiProvider(ctx('sk-test', 'testInspector.llm.openai.apiKey'), http);
  const res = await provider.complete({ system: '', user: '' });
  assert.ok(!res.ok);
  assert.match(res.error, /HTTP 429/);
  assert.match(res.error, /rate limited/);
});

test('llm-openai · returns error when API key is not configured', async () => {
  const provider = new OpenAiProvider(ctx(undefined, 'testInspector.llm.openai.apiKey'));
  const res = await provider.complete({ system: '', user: '' });
  assert.ok(!res.ok);
  assert.match(res.error, /not configured/i);
});

// ---------- Claude ----------

test('llm-claude · sends x-api-key + anthropic-version headers and system+messages body', async () => {
  const { http, calls } = captureHttp({
    status: 200,
    body: JSON.stringify({ content: [{ type: 'text', text: 'hello' }], model: 'claude-3-5-haiku-latest' }),
  });
  const provider = new ClaudeProvider(ctx('sk-ant-test', 'testInspector.llm.claude.apiKey'), http);
  const res = await provider.complete({ system: 'sys', user: 'usr' });
  assert.ok(res.ok);
  assert.equal(res.text, 'hello');
  assert.equal(calls[0]!.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(calls[0]!.headers['x-api-key'], 'sk-ant-test');
  assert.equal(calls[0]!.headers['anthropic-version'], '2023-06-01');
  const body = JSON.parse(calls[0]!.body ?? '{}');
  assert.equal(body.system, 'sys');
  assert.equal(body.messages[0].role, 'user');
  assert.equal(body.messages[0].content, 'usr');
});

test('llm-claude · finds the text part among multiple content blocks', async () => {
  const { http } = captureHttp({
    status: 200,
    body: JSON.stringify({ content: [{ type: 'tool_use' }, { type: 'text', text: 'the answer' }, { type: 'text', text: 'more' }] }),
  });
  const provider = new ClaudeProvider(ctx('sk-ant-test', 'testInspector.llm.claude.apiKey'), http);
  const res = await provider.complete({ system: '', user: '' });
  assert.ok(res.ok);
  // .find() returns the first match — Claude convention is one text block per response.
  assert.equal(res.text, 'the answer');
});

// ---------- Gemini ----------

test('llm-gemini · embeds API key in URL query and concatenates parts text', async () => {
  const { http, calls } = captureHttp({
    status: 200,
    body: JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'part one ' }, { text: 'part two' }] } }],
      modelVersion: 'gemini-2.5-flash',
    }),
  });
  const provider = new GeminiProvider(ctx('AIzaSy-test', 'testInspector.llm.gemini.apiKey'), http);
  const res = await provider.complete({ system: 'sys', user: 'usr' });
  assert.ok(res.ok);
  assert.equal(res.text, 'part one part two');
  assert.match(calls[0]!.url, /\?key=AIzaSy-test$/);
  assert.match(calls[0]!.url, /\/models\/gemini-2\.5-flash:generateContent/);
  const body = JSON.parse(calls[0]!.body ?? '{}');
  assert.equal(body.systemInstruction.parts[0].text, 'sys');
  assert.equal(body.contents[0].parts[0].text, 'usr');
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
});

test('llm-gemini · returns empty text when candidates/parts are missing without throwing', async () => {
  const { http } = captureHttp({
    status: 200,
    body: JSON.stringify({ /* no candidates */ }),
  });
  const provider = new GeminiProvider(ctx('AIzaSy-test', 'testInspector.llm.gemini.apiKey'), http);
  const res = await provider.complete({ system: '', user: '' });
  assert.ok(res.ok);
  assert.equal(res.text, '');
});

test('llm-gemini · surfaces HTTP 400 from Gemini with the response body', async () => {
  const { http } = captureHttp({ status: 400, body: '{"error":"API key invalid"}' });
  const provider = new GeminiProvider(ctx('AIzaSy-bad', 'testInspector.llm.gemini.apiKey'), http);
  const res = await provider.complete({ system: '', user: '' });
  assert.ok(!res.ok);
  assert.match(res.error, /HTTP 400/);
  assert.match(res.error, /API key invalid/);
});
