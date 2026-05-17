import assert from 'node:assert/strict';
import Module = require('node:module');
import { test } from 'node:test';

test('llm registry creates every supported provider and resolves the active provider from settings', () => {
  const { createProviderRegistry, activeProvider } = loadRegistryWithVscodeMock({
    provider: 'gemini',
    model: 'gemini-custom',
    geminiBaseUrl: 'https://gemini.local',
  });

  const registry = createProviderRegistry(secretsMock() as never);
  const active = activeProvider(registry);

  assert.deepEqual([...registry.keys()], ['openai', 'claude', 'gemini']);
  assert.equal(active?.id, 'gemini');
});

test('llm registry returns no active provider for none, missing, or unknown settings', () => {
  for (const provider of [undefined, 'none', 'unknown']) {
    const { createProviderRegistry, activeProvider } = loadRegistryWithVscodeMock({ provider });
    const registry = createProviderRegistry(secretsMock() as never);

    assert.equal(activeProvider(registry), undefined);
  }
});

test('llm registry passes provider-specific base URL overrides into provider contexts', async () => {
  const { createProviderRegistry } = loadRegistryWithVscodeMock({
    provider: 'openai',
    model: 'model-x',
    openaiBaseUrl: 'https://openai.local',
    claudeBaseUrl: 'https://claude.local',
    geminiBaseUrl: 'https://gemini.local',
  });
  const registry = createProviderRegistry(secretsMock('key') as never);
  const calls: string[] = [];

  for (const [id, provider] of registry) {
    await provider.complete({ system: '', user: '' });
    calls.push(`${id}:${provider.defaultModel}`);
  }

  assert.deepEqual(calls, [
    'openai:gpt-4o-mini',
    'claude:claude-3-5-haiku-latest',
    'gemini:gemini-2.5-flash',
  ]);
});

function loadRegistryWithVscodeMock(settings: Record<string, unknown>): typeof import('../../src/services/llm/registry') {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const modulePath of [
    '../../src/services/llm/registry',
    '../../src/services/llm/openai',
    '../../src/services/llm/claude',
    '../../src/services/llm/gemini',
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'vscode') {
      return {
        workspace: {
          getConfiguration: () => ({
            get: (key: string) => settings[key],
          }),
        },
      };
    }
    if (moduleName === './openai') {
      return { OpenAiProvider: providerClass('openai', 'gpt-4o-mini') };
    }
    if (moduleName === './claude') {
      return { ClaudeProvider: providerClass('claude', 'claude-3-5-haiku-latest') };
    }
    if (moduleName === './gemini') {
      return { GeminiProvider: providerClass('gemini', 'gemini-2.5-flash') };
    }
    return original(moduleName, parent, isMain);
  };
  try {
    return require('../../src/services/llm/registry') as typeof import('../../src/services/llm/registry');
  } finally {
    loader._load = original;
  }
}

function providerClass(id: string, defaultModel: string) {
  return class {
    readonly id = id;
    readonly displayName = id;
    readonly defaultModel = defaultModel;
    readonly suggestedModels = [defaultModel];
    constructor(private readonly ctx: { getModel: () => string | undefined; getBaseUrlOverride: () => string | undefined }) {}
    async isConfigured() {
      return true;
    }
    async testConnection() {
      return this.complete();
    }
    async complete() {
      return { ok: true as const, text: `${this.ctx.getModel() ?? this.defaultModel}:${this.ctx.getBaseUrlOverride() ?? ''}` };
    }
  };
}

function secretsMock(value?: string) {
  return {
    async get() {
      return value;
    },
    async store() {},
    async delete() {},
    onDidChange: () => ({ dispose() {} }),
  };
}
