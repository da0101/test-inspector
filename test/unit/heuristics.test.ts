import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  detectMockOnlyAssertions,
  detectMocksUnitUnderTest,
  detectVagueTitles,
} from '../../src/services/heuristics';

test('heuristics · vague-title fires on Copilot-style "works" / "renders" / "test 1" names', () => {
  const cases = [
    { id: '1', name: 'works', filePath: '/x', status: 'unknown' as const },
    { id: '2', name: 'renders', filePath: '/x', status: 'unknown' as const },
    { id: '3', name: 'test 1', filePath: '/x', status: 'unknown' as const },
    {
      id: '4',
      name: 'rejects login when password is wrong',
      filePath: '/x',
      status: 'unknown' as const,
    },
  ];
  const signal = detectVagueTitles(cases);
  assert.ok(signal);
  assert.equal(signal.name, 'vague-title');
  assert.match(signal.detail ?? '', /3 of 4/);
});

test('heuristics · vague-title is silent when every title is specific', () => {
  const cases = [
    {
      id: '1',
      name: 'returns 404 when the user is unknown',
      filePath: '/x',
      status: 'unknown' as const,
    },
    {
      id: '2',
      name: 'persists the appointment after booking',
      filePath: '/x',
      status: 'unknown' as const,
    },
  ];
  assert.equal(detectVagueTitles(cases), null);
});

test('heuristics · mock-only-assertions fires when verify(...) is the only assertion', () => {
  const content = `test('it', () => { verify(() => mockService.watch()).called(1); });`;
  const signal = detectMockOnlyAssertions(content);
  assert.ok(signal);
  assert.equal(signal.name, 'mock-only-assertions');
});

test('heuristics · mock-only-assertions fires when verifyNever is the only assertion', () => {
  const content = `test('emits null', () => { verifyNever(() => mockService.watchGeneration(any())); });`;
  const signal = detectMockOnlyAssertions(content);
  assert.ok(signal);
});

test('heuristics · mock-only-assertions is silent when behavior assertions outnumber mock ones', () => {
  const content = `
    test('rejects login', async () => {
      const r = await login('a', 'b');
      expect(r.ok).toBe(false);
      expect(r.error).toBeDefined();
      expect(mockTracker).toHaveBeenCalled();
    });`;
  assert.equal(detectMockOnlyAssertions(content), null);
});

test('heuristics · mocks-unit-under-test fires when jest.mock targets the file under test (TS)', () => {
  const content = `import Login from './Login';\njest.mock('./Login');\ntest('renders', () => {});`;
  const signal = detectMocksUnitUnderTest('/repo/src/auth/Login.test.tsx', content);
  assert.ok(signal);
  assert.equal(signal.name, 'mocks-unit-under-test');
  assert.match(signal.detail ?? '', /Login/);
});

test('heuristics · mocks-unit-under-test fires on @patch with the same module name (Python)', () => {
  const content = `from myapp.views import View\n@patch('myapp.views.View')\ndef test_view(mock_view): pass`;
  const signal = detectMocksUnitUnderTest('/repo/myapp/tests/test_views.py', content);
  assert.ok(signal);
});

test('heuristics · mocks-unit-under-test is silent when collaborators are mocked but not the unit', () => {
  const content = `import { login } from './login';\njest.mock('../api/userService');\ntest('login flow', () => {});`;
  assert.equal(detectMocksUnitUnderTest('/repo/src/auth/login.test.ts', content), null);
});
