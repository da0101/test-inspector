import assert from 'node:assert/strict';
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
    /timed out|aborted|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH/,
  );
  const elapsed = Date.now() - started;
  // Allow plenty of margin; the timeout firing within ~2s confirms it works at all.
  assert.ok(elapsed < 5000, `expected request to abort quickly via timeout, took ${elapsed} ms`);
});
