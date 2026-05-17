import * as path from 'node:path';
import type { CaseFile, CaseFileBundle } from './caseFile';
import type { FeatureScope } from '../models';

export type FeatureScopeOption = {
  label: string;
  query: string;
  description?: string;
};

export const ALL_FEATURES: FeatureScope = { kind: 'all', label: 'All features' };

export function filterCaseBundle(bundle: CaseFileBundle, scope: FeatureScope): CaseFileBundle {
  if (scope.kind === 'all') {
    return withFeatureLabel(bundle, scope.label);
  }
  const cases = bundle.cases.filter((caseFile) => matchesFeature(caseFile, scope.query));
  return {
    ...withFeatureLabel(bundle, scope.label),
    cases,
    totals: recountTotals(cases)
  };
}

export function buildFeatureScopeOptions(bundle: CaseFileBundle): FeatureScopeOption[] {
  const options = new Map<string, FeatureScopeOption>();
  for (const caseFile of bundle.cases) {
    for (const candidate of candidateLabels(caseFile.target.path)) {
      options.set(candidate.query, candidate);
    }
    for (const related of caseFile.evidence.relatedTests) {
      for (const candidate of candidateLabels(related.path)) {
        options.set(candidate.query, candidate);
      }
    }
  }
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label)).slice(0, 50);
}

function matchesFeature(caseFile: CaseFile, query: string): boolean {
  const haystack = [
    caseFile.target.path,
    caseFile.story.headline,
    caseFile.story.paragraph,
    ...caseFile.evidence.relatedTests.map((test) => test.path)
  ].join(' ').toLowerCase();
  const tokens = query.toLowerCase().split(/[^a-z0-9_-]+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
}

function candidateLabels(filePath: string): FeatureScopeOption[] {
  const normalized = filePath.split(path.sep).join('/');
  const parts = normalized.split('/').filter(Boolean);
  const options: FeatureScopeOption[] = [];
  const roots = new Set(['features', 'modules', 'domains', 'routes', 'pages']);
  for (let i = 0; i < parts.length - 1; i++) {
    if (roots.has(parts[i]) && parts[i + 1]) {
      options.push({ label: `${parts[i]} / ${parts[i + 1]}`, query: `${parts[i]} ${parts[i + 1]}`, description: filePath });
    }
  }
  const srcIndex = parts.lastIndexOf('src');
  if (srcIndex >= 0 && parts[srcIndex + 1]) {
    options.push({ label: `src / ${parts[srcIndex + 1]}`, query: parts[srcIndex + 1], description: filePath });
  }
  const libIndex = parts.lastIndexOf('lib');
  if (libIndex >= 0 && parts[libIndex + 1]) {
    options.push({ label: `lib / ${parts[libIndex + 1]}`, query: parts[libIndex + 1], description: filePath });
  }
  return options;
}

function withFeatureLabel(bundle: CaseFileBundle, featureLabel: string): CaseFileBundle {
  return {
    ...bundle,
    scope: {
      ...bundle.scope,
      featureLabel
    }
  };
}

function recountTotals(cases: CaseFile[]): CaseFileBundle['totals'] {
  const totals: CaseFileBundle['totals'] = { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 };
  for (const caseFile of cases) {
    totals[caseFile.verdict] += 1;
  }
  return totals;
}
