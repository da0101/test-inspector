import type { CoverageFile, QualityFinding, TestProject } from '../models';

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
  qualityFindings?: QualityFinding[];
};

export function synthesizeCaseFile(input: SynthesizeInput): CaseFileBundle {
  return {
    scanTimestamp: Date.now(),
    project: input.project,
    cases: [],
    totals: { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 },
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
