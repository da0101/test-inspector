import type * as vscode from 'vscode';

export type LlmProviderId = 'openai' | 'claude' | 'gemini';

export const PROVIDER_IDS: LlmProviderId[] = ['openai', 'claude', 'gemini'];

export type ProviderInput = {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  abortSignal?: AbortSignal;
};

export type ProviderResult =
  | { ok: true; text: string; modelUsed: string }
  | { ok: false; error: string };

export interface LlmProvider {
  readonly id: LlmProviderId;
  readonly displayName: string;
  readonly defaultModel: string;
  /** Suggested models the user can pick from when configuring. */
  readonly suggestedModels: string[];

  isConfigured(): Promise<boolean>;
  testConnection(): Promise<ProviderResult>;
  complete(input: ProviderInput): Promise<ProviderResult>;
}

export type ProviderContext = {
  secrets: vscode.SecretStorage;
  getModel: () => string | undefined;
  getBaseUrlOverride: () => string | undefined;
};

export const secretKey = (id: LlmProviderId): string => `testInspector.llm.${id}.apiKey`;
