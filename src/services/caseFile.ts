import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { CoverageFile, CoverageSummary, QualityFinding, TestFile, TestProject } from '../models';
import {
  detectMockOnlyAssertions,
  detectMocksUnitUnderTest,
  detectVagueTitles,
} from './heuristics';

export type CaseVerdict = 'THEATER' | 'WEAK' | 'MISSING' | 'STRONG' | 'OK';
export type SuggestionKind = 'delete' | 'rewrite' | 'add' | 'review' | 'ignore';

export type CaseSignal = {
  name: string;
  weight: number;
  location?: { file: string; line?: number };
  detail?: string;
};

export type CaseRelatedTest = {
  path: string;
  weaknesses: string[];
};

export type CaseFile = {
  target: { kind: 'source' | 'test' | 'feature'; path: string; projectId: string };
  verdict: CaseVerdict;
  killPriority: number;
  story: { headline: string; paragraph: string };
  evidence: {
    signals: CaseSignal[];
    relatedTests: CaseRelatedTest[];
    coverage?: CoverageFile;
  };
  suggestion: {
    kind: SuggestionKind;
    text: string;
    nextTestSketch?: string;
  };
};

export type CaseFileBundle = {
  scanTimestamp: number;
  project?: TestProject;
  cases: CaseFile[];
  totals: Record<CaseVerdict, number>;
};

export type SynthesizeInput = {
  project?: TestProject;
  testFiles?: TestFile[];
  qualityFindings?: QualityFinding[];
  coverage?: CoverageSummary;
};

export type FileReader = (filePath: string) => Promise<string>;
const defaultReadFile: FileReader = (p) => fs.readFile(p, 'utf8');

const FINDING_WEIGHT: Record<string, number> = {
  'skipped-test': 15,
  'focused-test': 20,
  'no-assertion': 35,
  'snapshot-only': 25,
  'trivial-assertion': 30,
  'weak-test': 20,
  'orphan-test': 15,
  'slow-test': 8,
  'parse-error': 50,
  'missing-related-test': 25,
  'missing-coverage': 10,
  'stale-test': 30,
};

export function emptyBundle(): CaseFileBundle {
  return {
    scanTimestamp: Date.now(),
    cases: [],
    totals: { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 },
  };
}

export async function synthesizeCaseFile(
  input: SynthesizeInput,
  readFile: FileReader = defaultReadFile,
): Promise<CaseFileBundle> {
  const bundle = emptyBundle();
  bundle.project = input.project;

  for (const testFile of input.testFiles ?? []) {
    let content: string | null = null;
    try {
      content = await readFile(testFile.path);
    } catch {
      // skip files we can't read
    }
    const caseFile = classifyTestFile(testFile, content);
    bundle.cases.push(caseFile);
    bundle.totals[caseFile.verdict] += 1;
  }

  bundle.cases.sort((a, b) => b.killPriority - a.killPriority);
  return bundle;
}

function classifyTestFile(testFile: TestFile, content: string | null): CaseFile {
  const signals: CaseSignal[] = [];

  for (const f of testFile.qualityFindings ?? []) {
    signals.push({
      name: f.kind,
      weight: FINDING_WEIGHT[f.kind] ?? 10,
      detail: f.message,
      location: f.line !== undefined ? { file: f.filePath, line: f.line } : undefined,
    });
  }

  if (content !== null) {
    const vague = detectVagueTitles(testFile.testCases);
    if (vague) signals.push(vague);
    const mockOnly = detectMockOnlyAssertions(content);
    if (mockOnly) signals.push(mockOnly);
    const mocksUnit = detectMocksUnitUnderTest(testFile.path, content);
    if (mocksUnit) signals.push(mocksUnit);
  }

  const weight = signals.reduce((acc, s) => acc + s.weight, 0);

  let verdict: CaseVerdict;
  if (weight >= 60) verdict = 'THEATER';
  else if (weight >= 20) verdict = 'WEAK';
  else if (weight > 0) verdict = 'WEAK';
  else verdict = 'STRONG';

  return {
    target: { kind: 'test', path: testFile.path, projectId: testFile.projectId },
    verdict,
    killPriority: weight,
    story: generateStory(testFile, signals, verdict),
    evidence: { signals, relatedTests: [] },
    suggestion: generateSuggestion(verdict, testFile),
  };
}

function generateStory(testFile: TestFile, signals: CaseSignal[], verdict: CaseVerdict): { headline: string; paragraph: string } {
  const name = path.basename(testFile.path);
  if (verdict === 'STRONG' || signals.length === 0) {
    return {
      headline: name,
      paragraph: `No theater patterns detected on static signals. Looks like it's doing its job.`,
    };
  }

  const reasons: string[] = [];
  const by = new Map<string, CaseSignal>();
  for (const s of signals) by.set(s.name, s);

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
    paragraph: `${verdictLabel}: ${reasons.join('; ')}. It will pass whether the production code is correct or broken. Fix is not "add more assertions" — delete this test and write one that triggers the actual behavior, then asserts on the observable result (returned value, persisted state, or rendered output a user would see).`,
  };
}

function generateSuggestion(verdict: CaseVerdict, testFile: TestFile): CaseFile['suggestion'] {
  const name = path.basename(testFile.path);
  if (verdict === 'THEATER') {
    return {
      kind: 'delete',
      text: `Delete \`${name}\` and replace it with a test that triggers the unit's behavior and asserts on the observable result (returned value, persisted state, or rendered output).`,
    };
  }
  if (verdict === 'WEAK') {
    return {
      kind: 'rewrite',
      text: `Keep \`${name}\` but extend it: add a case that exercises the error path, and assert on returned state, not just on mock calls.`,
    };
  }
  return {
    kind: 'review',
    text: 'Looks healthy on static signals. No action needed.',
  };
}

export function summarize(bundle: CaseFileBundle): string {
  if (bundle.cases.length === 0) return 'No cases yet — click Refresh to scan.';
  const t = bundle.totals;
  const parts: string[] = [];
  if (t.THEATER > 0) parts.push(`${t.THEATER} theater`);
  if (t.WEAK > 0) parts.push(`${t.WEAK} weak`);
  if (t.MISSING > 0) parts.push(`${t.MISSING} missing`);
  if (t.STRONG > 0) parts.push(`${t.STRONG} strong`);
  return parts.length > 0 ? parts.join(' · ') : 'All clean.';
}
