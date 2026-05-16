import * as vscode from 'vscode';
import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';
import { OpenAiProvider } from './openai';
import type { LlmProvider, LlmProviderId, ProviderContext } from './types';

export function createProviderRegistry(secrets: vscode.SecretStorage): Map<LlmProviderId, LlmProvider> {
  const baseCtx = (id: LlmProviderId): ProviderContext => ({
    secrets,
    getModel: () => {
      const cfg = vscode.workspace.getConfiguration('testInspector.llm');
      return cfg.get<string>('model') || undefined;
    },
    getBaseUrlOverride: () => {
      const cfg = vscode.workspace.getConfiguration('testInspector.llm');
      if (id === 'openai') return cfg.get<string>('openaiBaseUrl') || undefined;
      if (id === 'claude') return cfg.get<string>('claudeBaseUrl') || undefined;
      if (id === 'gemini') return cfg.get<string>('geminiBaseUrl') || undefined;
      return undefined;
    },
  });

  return new Map<LlmProviderId, LlmProvider>([
    ['openai', new OpenAiProvider(baseCtx('openai'))],
    ['claude', new ClaudeProvider(baseCtx('claude'))],
    ['gemini', new GeminiProvider(baseCtx('gemini'))],
  ]);
}

export function activeProvider(registry: Map<LlmProviderId, LlmProvider>): LlmProvider | undefined {
  const cfg = vscode.workspace.getConfiguration('testInspector.llm');
  const id = cfg.get<string>('provider');
  if (!id || id === 'none') return undefined;
  return registry.get(id as LlmProviderId);
}
