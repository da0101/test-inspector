import * as https from 'https';
import * as vscode from 'vscode';

export type LlmRequest = {
  system: string;
  user: string;
};

export type LlmProvider = {
  id: string;
  isConfigured(): Promise<boolean>;
  complete(request: LlmRequest): Promise<string>;
};

export class OpenAiCompatibleProvider implements LlmProvider {
  id = 'openai-compatible';

  constructor(private readonly secrets: vscode.SecretStorage) {}

  async isConfigured(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('testInspector.llm');
    return Boolean((await this.secrets.get(secretKey())) && config.get<string>('model'));
  }

  async complete(request: LlmRequest): Promise<string> {
    const config = vscode.workspace.getConfiguration('testInspector.llm');
    const apiKey = await this.secrets.get(secretKey());
    const model = config.get<string>('model') ?? 'gpt-4.1-mini';
    const baseUrl = config.get<string>('baseUrl') ?? 'https://api.openai.com/v1';
    if (!apiKey) {
      throw new Error('Missing testInspector.llm.apiKey.');
    }

    const payload = JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.user }
      ]
    });

    return postJson(`${baseUrl.replace(/\/$/, '')}/chat/completions`, apiKey, payload);
  }
}

export function secretKey(): string {
  return 'testInspector.llm.apiKey';
}

function postJson(urlText: string, apiKey: string, payload: string): Promise<string> {
  const url = new URL(urlText);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on('end', () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`LLM request failed: HTTP ${res.statusCode ?? 'unknown'} ${body.slice(0, 500)}`));
            return;
          }
          try {
            const parsed = JSON.parse(body) as { choices?: Array<{ message?: { content?: string } }> };
            resolve(parsed.choices?.[0]?.message?.content ?? '');
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
