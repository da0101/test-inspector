import assert from 'node:assert/strict';
import Module = require('node:module');
import { test } from 'node:test';
import type { LlmProvider } from '../../src/services/llm';

test('configureLlm cancels cleanly when the provider, action, or API key prompt is dismissed', async () => {
  const providerUnavailable = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [{ id: 'openai', label: 'OpenAI' }],
  }), undefined);
  await providerUnavailable.configureLlm({ secrets: fakeSecrets() } as unknown as import('vscode').ExtensionContext, outputMock());

  const actionCancelled = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [{ id: 'openai', label: 'OpenAI' }, 'gpt-test', undefined],
  }));
  await actionCancelled.configureLlm({ secrets: fakeSecrets() } as unknown as import('vscode').ExtensionContext, outputMock());

  const keyCancelled = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [{ id: 'openai', label: 'OpenAI' }, undefined, 'Add or replace API key'],
    inputValue: '',
  }));
  await keyCancelled.configureLlm({ secrets: fakeSecrets() } as unknown as import('vscode').ExtensionContext, outputMock());
});

test('configureLlm disables the optional reviewer without touching secrets', async () => {
  const updates: Array<{ key: string; value: unknown }> = [];
  const secrets = fakeSecrets();
  const { configureLlm } = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [{ id: 'none', label: 'Disable AI reviewer' }],
    updates,
  }));

  await configureLlm({ secrets } as unknown as import('vscode').ExtensionContext, outputMock());

  assert.deepEqual(updates, [{ key: 'provider', value: 'none' }]);
  assert.equal(secrets.stored.length, 0);
});

test('configureLlm stores, tests, and reports an API key without writing it to settings', async () => {
  const updates: Array<{ key: string; value: unknown }> = [];
  const secrets = fakeSecrets();
  const provider = providerFixture({
    displayName: 'OpenAI',
    suggestedModels: ['gpt-test'],
    testConnection: async () => ({ ok: true, text: '{"ok":true}', modelUsed: 'gpt-test' }),
  });
  const infoMessages: string[] = [];
  const { configureLlm } = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [
      { id: 'openai', label: 'OpenAI' },
      'gpt-test',
      'Add or replace API key',
    ],
    inputValue: '  sk-secret  ',
    updates,
    infoMessages,
  }), provider);

  await configureLlm({ secrets } as unknown as import('vscode').ExtensionContext, outputMock());

  assert.deepEqual(updates, [
    { key: 'provider', value: 'openai' },
    { key: 'model', value: 'gpt-test' },
  ]);
  assert.deepEqual(secrets.stored, [{ key: 'testInspector.llm.openai.apiKey', value: 'sk-secret' }]);
  assert.match(infoMessages.join('\n'), /reviewer configured/);
});

test('configureLlm deletes stored API keys and surfaces failed connection tests', async () => {
  const deletedSecrets = fakeSecrets();
  const deleteOutput = outputMock();
  const deleteFlow = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [
      { id: 'openai', label: 'OpenAI' },
      undefined,
      'Delete stored API key',
    ],
  }));

  await deleteFlow.configureLlm({ secrets: deletedSecrets } as unknown as import('vscode').ExtensionContext, deleteOutput);
  assert.deepEqual(deletedSecrets.deleted, ['testInspector.llm.openai.apiKey']);
  assert.match(deleteOutput.lines.join('\n'), /deleted OpenAI key/);

  const warningMessages: string[] = [];
  const failedProvider = providerFixture({
    displayName: 'OpenAI',
    suggestedModels: ['gpt-test'],
    testConnection: async () => ({ ok: false, error: 'bad key' }),
  });
  const failedFlow = loadAiReviewWithLlmMock(vscodeConfigureMock({
    quickPickResults: [
      { id: 'openai', label: 'OpenAI' },
      undefined,
      'Keep existing key',
    ],
    warningMessages,
  }), failedProvider);

  await failedFlow.configureLlm({ secrets: fakeSecrets() } as unknown as import('vscode').ExtensionContext, outputMock());
  assert.match(warningMessages.join('\n'), /bad key/);
});

function outputMock() {
  const lines: string[] = [];
  return {
    lines,
    appendLine(line: string) {
      lines.push(line);
    },
  } as unknown as import('vscode').OutputChannel & { lines: string[] };
}

function providerFixture(overrides: Partial<LlmProvider>): LlmProvider {
  return {
    id: 'openai',
    displayName: 'OpenAI',
    defaultModel: 'gpt-test',
    suggestedModels: ['gpt-test'],
    isConfigured: async () => true,
    testConnection: async () => ({ ok: true, text: 'ok', modelUsed: 'gpt-test' }),
    complete: async () => ({ ok: false, error: 'not implemented' }),
    ...overrides,
  };
}

function fakeSecrets() {
  return {
    stored: [] as Array<{ key: string; value: string }>,
    deleted: [] as string[],
    async get() {
      return undefined;
    },
    async store(key: string, value: string) {
      this.stored.push({ key, value });
    },
    async delete(key: string) {
      this.deleted.push(key);
    },
    onDidChange: () => ({ dispose() {} }),
  };
}

function vscodeConfigureMock(opts: {
  quickPickResults: unknown[];
  inputValue?: string;
  updates?: Array<{ key: string; value: unknown }>;
  infoMessages?: string[];
  warningMessages?: string[];
}) {
  const picks = [...opts.quickPickResults];
  return {
    ConfigurationTarget: { Workspace: 2 },
    window: {
      showQuickPick: async () => picks.shift(),
      showInputBox: async () => opts.inputValue,
      showInformationMessage: async (message: string) => opts.infoMessages?.push(message),
      showWarningMessage: async (message: string) => opts.warningMessages?.push(message),
    },
    workspace: {
      getConfiguration: () => ({
        get: () => 'none',
        update: async (key: string, value: unknown) => opts.updates?.push({ key, value }),
      }),
    },
  };
}

function loadAiReviewWithLlmMock(
  vscode: unknown,
  provider: LlmProvider | undefined = providerFixture({ displayName: 'OpenAI', suggestedModels: ['gpt-test'] }),
): typeof import('../../src/services/aiReviewController') {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  for (const modulePath of [
    '../../src/services/aiReviewController',
    '../../src/services/llm',
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'vscode') return vscode;
    if (moduleName === './llm') {
      return {
        PROVIDER_IDS: ['openai'],
        secretKey: (id: string) => `testInspector.llm.${id}.apiKey`,
        createProviderRegistry: () => provider ? new Map([['openai', provider]]) : new Map(),
        activeProvider: () => provider,
        enrichCase: async () => ({ ok: false, error: 'not used' }),
      };
    }
    return original(moduleName, parent, isMain);
  };
  try {
    return require('../../src/services/aiReviewController') as typeof import('../../src/services/aiReviewController');
  } finally {
    loader._load = original;
  }
}
