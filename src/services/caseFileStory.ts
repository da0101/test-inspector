import * as path from 'node:path';
import type { TestFile } from '../models';
import type { CaseFile, CaseSignal, CaseVerdict } from './caseFile';

export function generateStory(testFile: TestFile, signals: CaseSignal[], verdict: CaseVerdict): { headline: string; paragraph: string } {
  const name = path.basename(testFile.path);
  if (verdict === 'STRONG' || signals.length === 0) {
    return {
      headline: name,
      paragraph: `No theater patterns detected on static signals. Looks like it's doing its job.`
    };
  }

  const reasons: string[] = [];
  const by = new Map<string, CaseSignal>();
  for (const signal of signals) by.set(signal.name, signal);

  if (by.has('mocks-unit-under-test')) reasons.push('it mocks the unit under test, so its assertions can never fail meaningfully');
  if (by.has('mock-only-assertions')) reasons.push("its only assertions are on mock calls, not on returned state or rendered output");
  if (by.has('trivial-assertion')) reasons.push('the assertions are tautological (`expect(x).toBe(x)` style)');
  if (by.has('snapshot-only')) reasons.push('the only assertion is a snapshot — it tells you nothing about behavior');
  if (by.has('no-assertion')) reasons.push('the body contains zero assertions');
  const vague = by.get('vague-title');
  if (vague?.detail) reasons.push(vague.detail.toLowerCase());
  if (by.has('orphan-test') || by.has('weak-test')) reasons.push('it imports no production source from this project');
  if (by.has('skipped-test')) reasons.push('it is marked skipped — it never runs at all');
  if (by.has('focused-test')) reasons.push('it uses `.only`/`fit` — other tests in the file are silently skipped');
  if (by.has('parse-error')) reasons.push('it failed to parse at all');

  if (reasons.length === 0) reasons.push('it carries multiple weak signals when read end-to-end');

  const verdictLabel = verdict === 'THEATER' ? 'Theater test' : 'Weak test';
  return {
    headline: `${name} — ${reasons.length} weak signal${reasons.length === 1 ? '' : 's'}`,
    paragraph: `${verdictLabel}: ${reasons.join('; ')}. It will pass whether the production code is correct or broken. Fix is not "add more assertions" — delete this test and write one that triggers the actual behavior, then asserts on the observable result (returned value, persisted state, or rendered output a user would see).`
  };
}

export function generateSuggestion(verdict: CaseVerdict, testFile: TestFile): CaseFile['suggestion'] {
  const name = path.basename(testFile.path);
  if (verdict === 'THEATER') {
    return {
      kind: 'delete',
      text: `Delete \`${name}\` and replace it with a test that triggers the unit's behavior and asserts on the observable result (returned value, persisted state, or rendered output).`
    };
  }
  if (verdict === 'WEAK') {
    return {
      kind: 'rewrite',
      text: `Keep \`${name}\` but extend it: add a case that exercises the error path, and assert on returned state, not just on mock calls.`
    };
  }
  return {
    kind: 'review',
    text: 'Looks healthy on static signals. No action needed.'
  };
}
