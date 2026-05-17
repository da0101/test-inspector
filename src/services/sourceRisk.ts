import * as path from 'path';
import { promises as fs } from 'fs';
import { CoverageSummary, QualityFinding, SourceFileRisk, TestFile, TestProject } from '../models';
import { walkFiles } from '../utils/fs';
import { basenameWithoutKnownExtensions, isSourceFile, normalizePath } from '../utils/path';
import { buildRelatedTestsByImportGraph } from './importGraph';
import { isRelevantSource } from './sourceRiskFilters';

export async function analyzeSourceRisks(
  projects: TestProject[],
  tests: TestFile[],
  coverage: CoverageSummary[]
): Promise<SourceFileRisk[]> {
  const risks: SourceFileRisk[] = [];
  for (const project of projects) {
    const relatedByImport = await buildRelatedTestsByImportGraph(project, tests);
    const sourceFiles = await walkFiles(project.rootPath, {
      include: (filePath) => isSourceFile(filePath) && isRelevantSource(project, filePath)
    });
    const projectCoverage = coverage.find((summary) => summary.projectId === project.id);
    for (const sourceFile of sourceFiles) {
      const relatedTests = findRelatedTests(sourceFile, project, tests);
      for (const importedTest of relatedByImport.get(sourceFile) ?? []) {
        if (!relatedTests.includes(importedTest)) {
          relatedTests.push(importedTest);
        }
      }
      const rel = normalizePath(path.relative(project.rootPath, sourceFile));
      const text = await fs.readFile(sourceFile, 'utf8').catch(() => '');
      const profile = profileSource(project, rel, text);
      const coverageFile = projectCoverage?.files.find((file) => file.path === rel || file.path.endsWith(`/${rel}`));
      const findings: QualityFinding[] = [];
      if (relatedTests.length === 0) {
        findings.push({
          id: `${project.id}:missing-related-test:${rel}`,
          kind: 'missing-related-test',
          severity: 'warning',
          message: 'No likely related test found for this source file.',
          filePath: sourceFile
        });
      }
      if (projectCoverage && !coverageFile) {
        findings.push({
          id: `${project.id}:missing-coverage:${rel}`,
          kind: 'missing-coverage',
          severity: 'warning',
          message: 'No coverage entry found for this source file.',
          filePath: sourceFile
        });
      }
      if (coverageFile?.linesPct !== undefined && coverageFile.linesPct < 50) {
        findings.push({
          id: `${project.id}:low-coverage:${rel}`,
          kind: 'missing-coverage',
          severity: 'warning',
          message: `Low line coverage: ${coverageFile.linesPct}%.`,
          filePath: sourceFile
        });
      }
      let score = scoreRisk(profile.criticality, relatedTests.length, coverageFile?.linesPct, Boolean(projectCoverage), findings.length);
      if (profile.signals.includes('mostly static/config code')) {
        score = Math.min(score, 55);
      }
      if (findings.length > 0 && score >= 35) {
        risks.push({
          path: sourceFile,
          projectId: project.id,
          relatedTests,
          coverage: coverageFile,
          findings,
          score,
          criticality: profile.criticality,
          signals: profile.signals,
          recommendation: recommendation(profile.signals, relatedTests.length, coverageFile?.linesPct)
        });
      }
    }
  }
  return risks.sort((a, b) => b.score - a.score);
}

function findRelatedTests(filePath: string, project: TestProject, tests: TestFile[]): string[] {
  const sourceBase = basenameWithoutKnownExtensions(filePath);
  const sourceDir = normalizePath(path.dirname(path.relative(project.rootPath, filePath)));
  return tests
    .filter((test) => test.projectId === project.id)
    .filter((test) => {
      const testBase = basenameWithoutKnownExtensions(test.path);
      const relTestDir = normalizePath(path.dirname(path.relative(project.rootPath, test.path)));
      return (
        testBase === sourceBase ||
        testBase === `${sourceBase}_test` ||
        testBase === `test_${sourceBase}` ||
        relatedFeatureDirsMatch(project, sourceDir, relTestDir) ||
        relTestDir.includes(sourceDir) ||
        sourceDir.includes(relTestDir.replace(/(^|\/)(__tests__|tests?)$/, ''))
      );
    })
    .map((test) => test.path);
}

function relatedFeatureDirsMatch(project: TestProject, sourceDir: string, testDir: string): boolean {
  const sourceFeature = featureParts(project, sourceDir, 'source');
  const testFeature = featureParts(project, testDir, 'test');
  if (!sourceFeature.length || !testFeature.length) {
    return false;
  }
  if (sourceFeature[0] !== testFeature[0]) {
    return false;
  }
  if (project.framework === 'flutter') {
    return true;
  }
  return sourceFeature.slice(0, 2).join('/') === testFeature.slice(0, 2).join('/');
}

function featureParts(project: TestProject, dir: string, kind: 'source' | 'test'): string[] {
  const parts = dir.split('/').filter(Boolean);
  if (kind === 'source') {
    if (project.framework === 'flutter' && parts[0] === 'lib') {
      return parts.slice(1);
    }
    if ((project.framework === 'node' || project.framework === 'react' || project.framework === 'firebase-functions') && parts[0] === 'src') {
      return parts.slice(1);
    }
  }
  if (kind === 'test') {
    if (['test', 'tests', '__tests__'].includes(parts[0])) {
      return parts.slice(1);
    }
    const testsIndex = parts.findIndex((part) => ['test', 'tests', '__tests__'].includes(part));
    if (testsIndex >= 0) {
      return parts.slice(testsIndex + 1);
    }
  }
  return parts;
}

function profileSource(project: TestProject, relPath: string, text: string): { criticality: number; signals: string[] } {
  const haystack = `${relPath}\n${text}`.toLowerCase();
  const signals: string[] = [];
  let criticality = 0;

  const weightedSignals: Array<[RegExp, string, number]> = [
    [/\b(auth|login|logout|session|token|oauth|jwt)\b/, 'auth/session logic', 35],
    [/\b(permission|role|access|acl|policy)\b/, 'permission logic', 35],
    [/\b(patient|clinical|clinic|appointment|questionnaire|consent|medical|medication)\b/, 'clinical workflow', 30],
    [/\b(payment|billing|invoice|subscription|stripe)\b/, 'billing/payment logic', 35],
    [/\b(api|axios|fetch|graphql|mutation|request|response)\b/, 'API/data flow', 22],
    [/\b(form|validate|validation|schema|required|invalid)\b/, 'form/validation logic', 22],
    [/\b(useeffect|usestate|usereducer|redux|zustand|context)\b/, 'stateful UI logic', 18],
    [/\b(route|navigate|redirect|router)\b/, 'routing logic', 18],
    [/\b(async|await|promise|try\s*{|catch\s*\()\b/, 'async/error handling', 16],
    [/\bexport\s+(function|const|class)|export\s+default\b/, 'exported public surface', 14],
    [/\bif\s*\(|\bswitch\s*\(|\?\s*.*:/, 'branching behavior', 12]
  ];

  for (const [regex, label, weight] of weightedSignals) {
    if (regex.test(haystack)) {
      signals.push(label);
      criticality += weight;
    }
  }

  if (project.framework === 'react' && /\b[A-Z][A-Za-z0-9_]*\s*\([^)]*\)\s*{/.test(text)) {
    signals.push('React component behavior');
    criticality += 14;
  }

  if (isLowBehaviorPath(relPath, text)) {
    criticality = Math.min(criticality, 45);
    if (!signals.includes('mostly static/config code')) {
      signals.push('mostly static/config code');
    }
  }

  return { criticality: Math.min(100, criticality), signals: [...new Set(signals)] };
}

function isLowBehaviorPath(relPath: string, text: string): boolean {
  if (/(^|\/)(theme|themes|constants|flavors)\//.test(relPath)) {
    return !/\b(async|await|try\s*{|catch\s*\(|fetch|axios|mutation|signIn|signOut|login|delete|update|create)\b/i.test(text);
  }
  if (/(^|\/)(color_palettes|design_presets|preference_keys|status_colors)\.(ts|tsx|js|jsx|py|dart)$/.test(relPath)) {
    return true;
  }
  return false;
}

function scoreRisk(
  criticality: number,
  relatedTests: number,
  linesPct: number | undefined,
  hasCoverageReport: boolean,
  findingCount: number
): number {
  let score = criticality;
  if (relatedTests === 0) {
    score += 30;
  }
  if (hasCoverageReport && linesPct === undefined) {
    score += 20;
  } else if (linesPct !== undefined && linesPct < 50) {
    score += 30;
  } else if (linesPct !== undefined && linesPct < 80) {
    score += 12;
  }
  score += Math.min(10, findingCount * 3);
  return Math.min(100, score);
}

function recommendation(signals: string[], relatedTests: number, linesPct: number | undefined): string {
  if (relatedTests === 0) {
    return `Add behavior tests for ${signals.slice(0, 2).join(' and ') || 'the exported behavior'}.`;
  }
  if (linesPct !== undefined && linesPct < 50) {
    return 'Expand tests to cover branches, error states, and user-visible outcomes.';
  }
  return 'Review related tests for meaningful assertions and edge cases.';
}
