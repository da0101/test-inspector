import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { CaseFileScopeSummary, CoverageFile, CoverageSummary, QualityFinding, SourceFileRisk, TestFile, TestProject } from '../models';
import {
  detectMockOnlyAssertions,
  detectMocksUnitUnderTest,
  detectVagueTitles,
} from './heuristics';
import { generateStory, generateSuggestion } from './caseFileStory';
import { inferTestGaps, type TestGap } from './testGaps';

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
    gaps?: TestGap[];
  };
  suggestion: {
    kind: SuggestionKind;
    text: string;
    nextTestSketch?: string;
  };
  aiReview?: CaseFileAiReview;
};

export type CaseFileAiReview =
  | {
      status: 'accepted' | 'challenged';
      provider: string;
      model: string;
      reviewedAt: number;
      explanation: string;
      evidenceAnchors: Array<{ lineNumber: number; excerpt: string; issue: string }>;
      suggestedFix: { summary: string; pseudocode?: string };
      uncertaintyNotes?: string;
      droppedAnchors: number;
    }
  | {
      status: 'error';
      provider?: string;
      model?: string;
      reviewedAt: number;
      error: string;
    };

export type CoverageError = {
  message: string;
  steps: string[];
};

export type CaseFileBundle = {
  scanTimestamp: number;
  project?: TestProject;
  projects?: TestProject[];
  scope?: CaseFileScopeSummary;
  testFiles?: TestFile[];
  coverage?: CoverageSummary[];
  cases: CaseFile[];
  totals: Record<CaseVerdict, number>;
  /** Cases excluded from `cases` because the user marked them reviewed and the file hasn't changed since. */
  hiddenReviewedCount?: number;
  runtime?: {
    testCases: number;
    passed?: number;
    failed?: number;
    generatedAt?: number;
    command?: string;
  };
  /** Set when the last coverage attempt failed so the dashboard can show inline guidance. */
  coverageError?: CoverageError;
};

export type SynthesizeInput = {
  project?: TestProject;
  projects?: TestProject[];
  testFiles?: TestFile[];
  qualityFindings?: QualityFinding[];
  coverage?: CoverageSummary;
  coverageSummaries?: CoverageSummary[];
  sourceRisks?: SourceFileRisk[];
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
  bundle.projects = input.projects;
  bundle.testFiles = input.testFiles;
  bundle.coverage = input.coverageSummaries ?? (input.coverage ? [input.coverage] : undefined);
  bundle.runtime = { testCases: (input.testFiles ?? []).reduce((sum, file) => sum + file.testCases.length, 0) };

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

  for (const risk of input.sourceRisks ?? []) {
    const caseFile = classifySourceFile(risk);
    if (caseFile === null) continue;
    bundle.cases.push(caseFile);
    bundle.totals[caseFile.verdict] += 1;
  }

  bundle.cases.sort((a, b) => b.killPriority - a.killPriority);
  return bundle;
}

function classifySourceFile(risk: SourceFileRisk): CaseFile | null {
  const noTests = (risk.relatedTests?.length ?? 0) === 0;
  const linesPct = risk.coverage?.linesPct;
  const branchesPct = risk.coverage?.branchesPct;
  const functionsPct = risk.coverage?.functionsPct;
  const veryLowCoverage = linesPct !== undefined && linesPct < 5;
  const lowCoverage = linesPct !== undefined && linesPct < 50;
  const lowBranchCoverage = branchesPct !== undefined && branchesPct < 70;
  const lowFunctionCoverage = functionsPct !== undefined && functionsPct < 70;
  const lowScenarioCoverage = lowBranchCoverage || lowFunctionCoverage;
  const critical = (risk.criticality ?? 0) > 0;

  if (!critical) return null;
  if (!noTests && !lowCoverage && !lowScenarioCoverage) return null;

  // Promote near-zero coverage to MISSING — basename-matched test files often
  // exist without actually exercising the source. 1% coverage = effectively
  // untested even if a sibling test file is present.
  const effectivelyUntested = noTests || veryLowCoverage;
  const verdict: CaseVerdict = effectivelyUntested ? 'MISSING' : 'WEAK';
  const killPriority = Math.max(risk.score ?? 0, effectivelyUntested ? 60 : 30);
  const name = path.basename(risk.path);

  const signalList: CaseSignal[] = [];

  // Collapse criticality keywords into ONE signal — they're a multiplier,
  // not independent evidence. Listing each as +10 was noise.
  const criticalitySignals = (risk.signals ?? []);
  if (criticalitySignals.length > 0) {
    signalList.push({
      name: 'high-criticality',
      weight: Math.min(30, criticalitySignals.length * 6),
      detail: criticalitySignals.join(', '),
    });
  }
  if (noTests) {
    signalList.push({
      name: 'no-related-tests',
      weight: 30,
      detail: 'no test file imports or covers this source',
    });
  } else if (veryLowCoverage && linesPct !== undefined) {
    signalList.push({
      name: 'near-zero-coverage',
      weight: 30,
      detail: `${linesPct.toFixed(0)}% line coverage — effectively untested`,
    });
  } else if (lowCoverage && linesPct !== undefined) {
    signalList.push({
      name: 'low-line-coverage',
      weight: 20,
      detail: `${linesPct.toFixed(0)}% line coverage`,
    });
  }
  if (lowBranchCoverage && branchesPct !== undefined) {
    signalList.push({
      name: 'low-branch-coverage',
      weight: 18,
      detail: `${branchesPct.toFixed(0)}% branch coverage — alternate paths need tests`,
    });
  }
  if (lowFunctionCoverage && functionsPct !== undefined) {
    signalList.push({
      name: 'low-function-coverage',
      weight: 12,
      detail: `${functionsPct.toFixed(0)}% function coverage — some functions are unreached`,
    });
  }

  const signalSummary = criticalitySignals.slice(0, 4).join(', ');
  const headline = noTests
    ? `${name} — critical code with no tests`
    : veryLowCoverage
      ? `${name} — critical code with ${linesPct?.toFixed(0)}% coverage (effectively untested)`
      : lowCoverage
        ? `${name} — critical code with ${linesPct?.toFixed(0)}% coverage`
        : `${name} — critical code with untested branches/functions`;

  const paragraph = noTests
    ? `This file looks like critical code (${signalSummary || 'flagged by multiple criticality signals'}) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.`
    : veryLowCoverage
      ? `This file is critical (${signalSummary || 'flagged by multiple criticality signals'}) and only ${linesPct?.toFixed(0)}% of its lines are exercised. A test file exists by name but the coverage is so low it's not actually testing this code. Either rewrite that test to drive real behavior, or add a new one.`
      : lowCoverage
        ? `This file is critical (${signalSummary || 'flagged by multiple criticality signals'}) and only ${linesPct?.toFixed(0)}% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.`
        : `This file is critical (${signalSummary || 'flagged by multiple criticality signals'}) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.`;

  const suggestion: CaseFile['suggestion'] = {
    kind: 'add',
    text: sourceSuggestionText(risk, name, noTests),
  };
  const gaps = inferTestGaps(risk);

  return {
    target: { kind: 'source', path: risk.path, projectId: risk.projectId },
    verdict,
    killPriority,
    story: { headline, paragraph },
    evidence: {
      signals: signalList,
      relatedTests: (risk.relatedTests ?? []).map((p) => ({ path: p, weaknesses: [] })),
      coverage: risk.coverage,
      gaps,
    },
    suggestion,
  };
}

function sourceSuggestionText(risk: SourceFileRisk, name: string, noTests: boolean): string {
  const base = risk.recommendation
    ? risk.recommendation
    : noTests
      ? `Add a new test file that imports and exercises \`${name}\`. Start with one happy-path case + one error-path case.`
      : `Extend existing tests for \`${name}\` to cover the uncovered lines (the error / branch paths).`;
  const firstGap = inferTestGaps(risk)[0];
  return firstGap ? `${base} Start with: ${firstGap.suggestedTest}` : base;
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
