import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import Module = require('node:module');
import { test } from 'node:test';
import { httpRequest } from '../../src/services/llm/http';

test('llm-http · rejects http:// URLs for non-localhost hosts', async () => {
  await assert.rejects(
    httpRequest({ method: 'POST', url: 'http://api.example.com/x', headers: {} }),
    /Refusing non-https URL/,
  );
});

test('llm-http · allows http:// only to localhost', async () => {
  // We don't actually want to make a real network call here, but the URL
  // validation should pass and the helper should attempt the connection.
  // If validation is broken (rejects localhost), this throws synchronously.
  // If validation is correct, it tries to connect and fails with a network error,
  // not the "Refusing non-https URL" message.
  await assert.rejects(
    httpRequest({ method: 'GET', url: 'http://localhost:1/never-listens', headers: {}, timeoutMs: 100 }),
    (err: Error) => !/Refusing non-https URL/.test(err.message),
  );
});

test('llm-http · returns status and body from the transport response', async () => {
  const { httpRequest: request } = loadWithHttpMock({
    status: 418,
    body: ['short ', 'and stout'],
  });

  const res = await request({ method: 'GET', url: 'http://localhost/test', headers: {}, timeoutMs: 1000 });

  assert.equal(res.status, 418);
  assert.equal(res.body, 'short and stout');
});

test('llm-http · sends POST body and content length when body is present', async () => {
  const captured: CapturedRequest[] = [];
  const { httpRequest: request } = loadWithHttpMock({
    status: 200,
    body: ['ok'],
    captured,
  });

  const body = JSON.stringify({ hello: 'world' });
  const res = await request({ method: 'POST', url: 'http://localhost/test', headers: {}, body, timeoutMs: 1000 });

  assert.equal(res.status, 200);
  assert.equal(captured[0]!.writtenBody, body);
  assert.equal(captured[0]!.options.headers['Content-Length'], String(Buffer.byteLength(body)));
});

test('llm-http · accepts https:// URLs (validation passes; connection may fail but not on the protocol guard)', async () => {
  await assert.rejects(
    httpRequest({ method: 'GET', url: 'https://127.0.0.1:1/never-listens', headers: {}, timeoutMs: 100 }),
    (err: Error) => !/Refusing non-https URL/.test(err.message),
  );
});

test('llm-http · timeout destroys the request after timeoutMs', async () => {
  const started = Date.now();
  await assert.rejects(
    httpRequest({ method: 'GET', url: 'https://10.255.255.1/blackhole', headers: {}, timeoutMs: 200 }),
    /timed out|aborted|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH|EPERM/,
  );
  const elapsed = Date.now() - started;
  // Allow plenty of margin; the timeout firing within ~2s confirms it works at all.
  assert.ok(elapsed < 5000, `expected request to abort quickly via timeout, took ${elapsed} ms`);
});

type CapturedRequest = {
  options: { headers: Record<string, string> };
  writtenBody: string;
};

function loadWithHttpMock(opts: { status: number; body: string[]; captured?: CapturedRequest[] }): typeof import('../../src/services/llm/http') {
  const loader = Module as unknown as { _load: (...args: unknown[]) => unknown };
  const original = loader._load;
  const resolved = require.resolve('../../src/services/llm/http');
  delete require.cache[resolved];
  const httpMock = {
    request: (options: { headers: Record<string, string> }, callback: (res: EventEmitter & { statusCode: number; setEncoding: () => void }) => void) => {
      const req = new EventEmitter() as EventEmitter & {
        write: (chunk: string) => void;
        end: () => void;
        destroy: (err: Error) => void;
      };
      const captured: CapturedRequest = { options, writtenBody: '' };
      opts.captured?.push(captured);
      req.write = (chunk: string) => {
        captured.writtenBody += chunk;
      };
      req.destroy = (err: Error) => req.emit('error', err);
      req.end = () => {
        const res = new EventEmitter() as EventEmitter & { statusCode: number; setEncoding: () => void };
        res.statusCode = opts.status;
        res.setEncoding = () => {};
        callback(res);
        for (const chunk of opts.body) res.emit('data', chunk);
        res.emit('end');
      };
      return req;
    },
  };
  loader._load = (moduleName: unknown, parent: unknown, isMain: unknown) => {
    if (moduleName === 'node:http') return httpMock;
    return original(moduleName, parent, isMain);
  };
  try {
    return require('../../src/services/llm/http') as typeof import('../../src/services/llm/http');
  } finally {
    loader._load = original;
  }
}
