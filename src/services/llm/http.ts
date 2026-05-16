import * as http from 'node:http';
import * as https from 'node:https';

export type HttpResponse = { status: number; body: string };

export type HttpRequestInit = {
  method: 'POST' | 'GET';
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  abortSignal?: AbortSignal;
};

/**
 * Minimal https POST/GET helper. The extension cannot pull node-fetch from a
 * CDN, and we avoid relying on global fetch so that the codebase compiles on
 * older Node targets in the VS Code engine matrix.
 */
export function httpRequest(init: HttpRequestInit): Promise<HttpResponse> {
  const url = new URL(init.url);
  const httpsProtocols: ReadonlySet<string> = new Set(['https:']);
  const httpProtocols: ReadonlySet<string> = new Set(['http:']);
  if (!httpsProtocols.has(url.protocol) && !(httpProtocols.has(url.protocol) && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'))) {
    return Promise.reject(new Error(`Refusing non-https URL: ${init.url}`));
  }

  return new Promise((resolve, reject) => {
    const timeout = init.timeoutMs ?? 60_000;
    const body = init.body ?? '';
    const headers: Record<string, string> = { ...init.headers };
    if (init.method === 'POST' && body && headers['Content-Length'] === undefined) {
      headers['Content-Length'] = String(Buffer.byteLength(body));
    }

    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(
      {
        method: init.method,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        headers,
        timeout,
      },
      (res) => {
        let chunks = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          chunks += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, body: chunks });
        });
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`Request to ${url.hostname} timed out after ${timeout} ms`));
    });
    if (init.abortSignal) {
      init.abortSignal.addEventListener('abort', () => req.destroy(new Error('aborted')), { once: true });
    }
    if (body) req.write(body);
    req.end();
  });
}
