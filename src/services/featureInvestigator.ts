import { promises as fs } from 'fs';
import * as path from 'path';
import { FeatureArea, FeatureInvestigationReport, QualityFinding, SourceFileRisk, TestFile, TestProject, TestSuggestion } from '../models';
import { normalizePath } from '../utils/path';
import { LlmProvider } from './llm';

export async function investigateFeatureArea(
  feature: FeatureArea,
  project: TestProject,
  risks: SourceFileRisk[],
  tests: TestFile[],
  llm: LlmProvider
): Promise<FeatureInvestigationReport> {
  const featureRisks = risks.filter((risk) => risk.projectId === feature.projectId && risk.path.startsWith(feature.rootPath)).slice(0, 12);
  const featureTests = tests.filter((test) => feature.testFiles.includes(test.path));
  const weakFindings = featureTests.flatMap((test) => test.qualityFindings);
  const suggestedTests = buildFeatureSuggestions(feature, featureRisks, weakFindings);
  let llmSummary: string | undefined;
  const llmEnabled = await llm.isConfigured();
  if (llmEnabled) {
    llmSummary = await llm.complete({
      system:
        'You are Test Inspector, a senior test-quality investigator. Review a feature/module as a whole. Focus on missing behavior coverage, weak tests, critical edge cases, and targeted test plan. Be concrete and concise.',
      user: await buildPrompt(feature, project, featureRisks, featureTests)
    });
  }
  return {
    generatedAt: new Date().toISOString(),
    feature,
    project,
    risks: featureRisks,
    weakFindings,
    suggestedTests,
    llmEnabled,
    llmSummary
  };
}

function buildFeatureSuggestions(feature: FeatureArea, risks: SourceFileRisk[], weakFindings: QualityFinding[]): TestSuggestion[] {
  const suggestions: TestSuggestion[] = [];
  if (!feature.testFiles.length) {
    suggestions.push({
      title: 'Create a feature-level test suite',
      reason: 'No tests were mapped to this feature area.'
    });
  }
  const signals = new Set(feature.signals);
  if (signals.has('clinical workflow')) {
    suggestions.push({ title: 'Cover clinical workflow branches', reason: 'Test safe/blocked states, invalid inputs, and user-visible clinical outcomes.' });
  }
  if (signals.has('API/data flow')) {
    suggestions.push({ title: 'Cover API lifecycle states', reason: 'Test loading, success, empty, validation failure, and server failure states.' });
  }
  if (signals.has('form/validation logic')) {
    suggestions.push({ title: 'Cover validation matrix', reason: 'Test required fields, invalid values, boundary values, and displayed errors.' });
  }
  if (signals.has('permission logic') || signals.has('auth/session logic')) {
    suggestions.push({ title: 'Cover access-control edge cases', reason: 'Test unauthenticated, unauthorized, expired session, and allowed states.' });
  }
  if (weakFindings.length) {
    suggestions.push({ title: 'Replace weak tests with behavior assertions', reason: `${weakFindings.length} weak-test findings were found in mapped tests.` });
  }
  if (risks.some((risk) => risk.coverage?.linesPct !== undefined && risk.coverage.linesPct < 50)) {
    suggestions.push({ title: 'Prioritize low-coverage risky files', reason: 'Several files have low coverage and critical behavior signals.' });
  }
  return unique(suggestions).slice(0, 8);
}

async function buildPrompt(feature: FeatureArea, project: TestProject, risks: SourceFileRisk[], tests: TestFile[]): Promise<string> {
  const sourceSnippets = await Promise.all(
    feature.sourceFiles.slice(0, 8).map(async (filePath) => ({
      path: normalizePath(path.relative(project.rootPath, filePath)),
      text: await readLimited(filePath, 5000)
    }))
  );
  const testSnippets = await Promise.all(
    tests.slice(0, 6).map(async (test) => ({
      path: normalizePath(path.relative(project.rootPath, test.path)),
      findings: test.qualityFindings,
      text: await readLimited(test.path, 5000)
    }))
  );
  return [
    `Project: ${project.label} (${project.framework})`,
    `Feature: ${feature.label}`,
    `Root: ${normalizePath(path.relative(project.rootPath, feature.rootPath))}`,
    `Risk score: ${feature.riskScore}`,
    `Average coverage: ${feature.averageCoverage ?? 'unknown'}`,
    `Source files: ${feature.sourceFiles.length}`,
    `Mapped tests: ${feature.testFiles.length}`,
    `Signals: ${feature.signals.join(', ') || 'none'}`,
    `Targeted command: ${feature.recommendedCommand ?? 'none'}`,
    '',
    'Top source risks:',
    ...risks.map((risk) => `- ${normalizePath(path.relative(project.rootPath, risk.path))}: risk ${risk.score}; ${risk.recommendation}`),
    '',
    'Source snippets:',
    ...sourceSnippets.flatMap((snippet) => [`Source: ${snippet.path}`, fenced(snippet.text)]),
    '',
    'Mapped test snippets:',
    ...(testSnippets.length
      ? testSnippets.flatMap((snippet) => [
          `Test: ${snippet.path}`,
          `Known findings: ${snippet.findings.map((finding) => `${finding.kind}: ${finding.message}`).join('; ') || 'none'}`,
          fenced(snippet.text)
        ])
      : ['No mapped tests.']),
    '',
    'Return markdown with sections: Verdict, Current test strength, Missing feature behaviors, Edge cases, Targeted test plan.'
  ].join('\n');
}

async function readLimited(filePath: string, maxChars: number): Promise<string> {
  const text = await fs.readFile(filePath, 'utf8').catch(() => '');
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n\n/* truncated by Test Inspector */` : text;
}

function fenced(text: string): string {
  return ['```', text, '```'].join('\n');
}

function unique(suggestions: TestSuggestion[]): TestSuggestion[] {
  return [...new Map(suggestions.map((suggestion) => [suggestion.title, suggestion])).values()];
}
