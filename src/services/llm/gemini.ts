import { httpRequest as defaultHttpRequest } from './http';
type HttpFn = typeof defaultHttpRequest;
import {
  secretKey,
  type LlmProvider,
  type ProviderContext,
  type ProviderInput,
  type ProviderResult,
} from './types';

export class GeminiProvider implements LlmProvider {
  readonly id = 'gemini' as const;
  readonly displayName = 'Google Gemini';
  readonly defaultModel = 'gemini-2.5-flash';
  readonly suggestedModels = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  constructor(
    private readonly ctx: ProviderContext,
    private readonly httpRequest: HttpFn = defaultHttpRequest,
  ) {}

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.ctx.secrets.get(secretKey('gemini')));
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
    const apiKey = await this.ctx.secrets.get(secretKey('gemini'));
    if (!apiKey) return { ok: false, error: 'Gemini API key not configured.' };

    const model = this.ctx.getModel() || this.defaultModel;
    const base = (this.ctx.getBaseUrlOverride() || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
    const url = `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ role: 'user', parts: [{ text: input.user }] }],
      generationConfig: {
        temperature: input.temperature ?? 0,
        maxOutputTokens: input.maxTokens ?? 1024,
        responseMimeType: 'application/json',
      },
    });

    const res = await this.httpRequest({
      method: 'POST',
      url,
      headers: { 'Content-Type': 'application/json' },
      body,
      abortSignal: input.abortSignal,
    });

    if (res.status < 200 || res.status >= 300) {
      return { ok: false, error: `Gemini HTTP ${res.status}: ${res.body.slice(0, 300)}` };
    }
    try {
      const parsed = JSON.parse(res.body) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        modelVersion?: string;
      };
      const text = parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      return { ok: true, text, modelUsed: parsed.modelVersion ?? model };
    } catch (err) {
      return { ok: false, error: `Gemini response was not JSON: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
}
