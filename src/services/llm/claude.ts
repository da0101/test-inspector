import { httpRequest as defaultHttpRequest } from './http';
type HttpFn = typeof defaultHttpRequest;
import {
  secretKey,
  type LlmProvider,
  type ProviderContext,
  type ProviderInput,
  type ProviderResult,
} from './types';

export class ClaudeProvider implements LlmProvider {
  readonly id = 'claude' as const;
  readonly displayName = 'Anthropic Claude';
  readonly defaultModel = 'claude-3-5-haiku-latest';
  readonly suggestedModels = [
    'claude-3-5-haiku-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-opus-latest',
  ];

  constructor(
    private readonly ctx: ProviderContext,
    private readonly httpRequest: HttpFn = defaultHttpRequest,
  ) {}

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.ctx.secrets.get(secretKey('claude')));
  }

  async testConnection(): Promise<ProviderResult> {
    return this.complete({
      system: 'Return only valid JSON.',
      user: 'Return {"ok":true}.',
      temperature: 0,
      maxTokens: 16,
    });
  }

  async complete(input: ProviderInput): Promise<ProviderResult> {
    const apiKey = await this.ctx.secrets.get(secretKey('claude'));
    if (!apiKey) return { ok: false, error: 'Anthropic API key not configured.' };

    const model = this.ctx.getModel() || this.defaultModel;
    const url = (this.ctx.getBaseUrlOverride() || 'https://api.anthropic.com/v1/messages').replace(/\/+$/, '');

    const body = JSON.stringify({
      model,
      max_tokens: input.maxTokens ?? 1024,
      temperature: input.temperature ?? 0,
      system: input.system,
      messages: [{ role: 'user', content: input.user }],
    });

    const res = await this.httpRequest({
      method: 'POST',
      url,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body,
      abortSignal: input.abortSignal,
    });

    if (res.status < 200 || res.status >= 300) {
      return { ok: false, error: `Claude HTTP ${res.status}: ${res.body.slice(0, 300)}` };
    }
    try {
      const parsed = JSON.parse(res.body) as {
        content?: Array<{ type?: string; text?: string }>;
        model?: string;
      };
      const text = parsed.content?.find((c) => c.type === 'text')?.text ?? '';
      return { ok: true, text, modelUsed: parsed.model ?? model };
    } catch (err) {
      return { ok: false, error: `Claude response was not JSON: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
}
