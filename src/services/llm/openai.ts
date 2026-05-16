import { httpRequest as defaultHttpRequest } from './http';
type HttpFn = typeof defaultHttpRequest;
import {
  secretKey,
  type LlmProvider,
  type ProviderContext,
  type ProviderInput,
  type ProviderResult,
} from './types';

export class OpenAiProvider implements LlmProvider {
  readonly id = 'openai' as const;
  readonly displayName = 'OpenAI';
  readonly defaultModel = 'gpt-4o-mini';
  readonly suggestedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'];

  constructor(
    private readonly ctx: ProviderContext,
    private readonly httpRequest: HttpFn = defaultHttpRequest,
  ) {}

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.ctx.secrets.get(secretKey('openai')));
  }

  async testConnection(): Promise<ProviderResult> {
    return this.complete({
      system: 'Return only valid JSON.',
      user: 'Return {"ok":true}.',
      temperature: 0,
      maxTokens: 8,
    });
  }

  async complete(input: ProviderInput): Promise<ProviderResult> {
    const apiKey = await this.ctx.secrets.get(secretKey('openai'));
    if (!apiKey) return { ok: false, error: 'OpenAI API key not configured.' };

    const model = this.ctx.getModel() || this.defaultModel;
    const base = (this.ctx.getBaseUrlOverride() || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const url = `${base}/chat/completions`;

    const body = JSON.stringify({
      model,
      temperature: input.temperature ?? 0,
      max_tokens: input.maxTokens ?? 1024,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.user },
      ],
    });

    const res = await this.httpRequest({
      method: 'POST',
      url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
      abortSignal: input.abortSignal,
    });

    if (res.status < 200 || res.status >= 300) {
      return { ok: false, error: `OpenAI HTTP ${res.status}: ${res.body.slice(0, 300)}` };
    }
    try {
      const parsed = JSON.parse(res.body) as {
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
      };
      const text = parsed.choices?.[0]?.message?.content ?? '';
      return { ok: true, text, modelUsed: parsed.model ?? model };
    } catch (err) {
      return { ok: false, error: `OpenAI response was not JSON: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
}
