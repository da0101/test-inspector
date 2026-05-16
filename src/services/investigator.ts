import { promises as fs } from 'fs';
import * as path from 'path';
import { InvestigationReport, QualityFinding, SourceFileRisk, TestFile, TestProject, TestSuggestion } from '../models';
import { basenameWithoutKnownExtensions, normalizePath } from '../utils/path';
import { LlmProvider } from './llm';

export async function investigateSourceRisk(
  risk: SourceFileRisk,
  project: TestProject,
  testFiles: TestFile[],
  llm: LlmProvider
): Promise<InvestigationReport> {
  const sourceText = await readLimited(risk.path, 16000);
  const relatedTestFiles = testFiles.filter((test) => risk.relatedTests.includes(test.path));
  const relatedTexts = await Promise.all(
    relatedTestFiles.slice(0, 4).map(async (test) => ({
      path: test.path,
      text: await readLimited(test.path, 12000),
      findings: test.qualityFindings
    }))
  );
  const sourceSummary = summarizeSource(sourceText);
  const weakTestFindings = relatedTestFiles.flatMap((test) => test.qualityFindings);
  const deterministicSuggestions = suggestTests(risk, sourceText, relatedTestFiles);

  let llmSummary: string | undefined;
  const llmEnabled = await llm.isConfigured();
  if (llmEnabled) {
    llmSummary = await llm.complete({
      system:
        'You are Test Inspector, a senior test-quality investigator. Review source code and tests. Be concrete, skeptical, and concise. Focus on missing behavior tests, weak assertions, edge cases, and risky untested flows. Do not invent files or APIs.',
      user: buildPrompt(risk, project, sourceText, relatedTexts)
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    sourcePath: risk.path,
    projectId: project.id,
    riskScore: risk.score,
    criticality: risk.criticality,
    coverage: risk.coverage,
    relatedTests: risk.relatedTests,
    signals: risk.signals,
    deterministicFindings: risk.findings,
    sourceSummary,
    weakTestFindings,
    llmEnabled,
    llmSummary,
    suggestedTests: deterministicSuggestions
  };
}

function summarizeSource(text: string): string[] {
  const summary = [];
  const exports = [...text.matchAll(/\bexport\s+(?:default\s+)?(?:function|const|class)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]);
  const hooks = [...text.matchAll(/\b(useEffect|useMemo|useCallback|useState|useReducer)\s*\(/g)].map((match) => match[1]);
  const branches = (text.match(/\b(if|switch|catch)\s*\(/g) ?? []).length;
  if (exports.length) {
    summary.push(`Exports: ${exports.slice(0, 8).join(', ')}`);
  }
  if (hooks.length) {
    summary.push(`React hooks used: ${[...new Set(hooks)].join(', ')}`);
  }
  if (branches) {
    summary.push(`Contains ${branches} conditional/error-handling branches.`);
  }
  if (/\b(fetch|axios|graphql|mutate|mutation)\b/i.test(text)) {
    summary.push('Touches API/data-fetching behavior.');
  }
  if (/\b(validate|schema|required|error|invalid)\b/i.test(text)) {
    summary.push('Contains validation/error-state behavior.');
  }
  return summary.length ? summary : ['No obvious exported behavior summary from static scan.'];
}

function suggestTests(risk: SourceFileRisk, sourceText: string, relatedTests: TestFile[]): TestSuggestion[] {
  const suggestions: TestSuggestion[] = [];
  if (relatedTests.length === 0) {
    suggestions.push({
      title: `Create a related test for ${path.basename(risk.path)}`,
      reason: 'No direct related test was found by filename or import mapping.'
    });
  }
  for (const signal of risk.signals) {
    if (signal === 'clinical workflow') {
      suggestions.push({
        title: 'Cover the clinical workflow decision points',
        reason: 'Clinical paths should verify happy path, blocked/invalid state, and user-visible safety messaging.'
      });
    }
    if (signal === 'form/validation logic') {
      suggestions.push({
        title: 'Add validation tests',
        reason: 'Exercise required fields, invalid values, and how validation errors are presented.'
      });
    }
    if (signal === 'API/data flow') {
      suggestions.push({
        title: 'Add API success and failure tests',
        reason: 'Verify loading, success, empty, and failure states rather than only render output.'
      });
    }
    if (signal === 'stateful UI logic') {
      suggestions.push({
        title: 'Add interaction/state-transition tests',
        reason: 'Simulate the user action that changes state and assert the visible result.'
      });
    }
  }
  if ((risk.coverage?.linesPct ?? 100) < 50) {
    suggestions.push({
      title: 'Cover low-coverage branches',
      reason: `Line coverage is ${risk.coverage?.linesPct ?? 'unknown'}; focus on branches and user-visible outcomes.`
    });
  }
  if (/\bcatch\s*\(|try\s*{|\berror\b/i.test(sourceText)) {
    suggestions.push({
      title: 'Add error-path tests',
      reason: 'The source includes error handling; verify failure UI/state, not only the happy path.'
    });
  }
  if (/\bif\s*\(|\bswitch\s*\(/.test(sourceText)) {
    suggestions.push({
      title: 'Add branch/edge-case tests',
      reason: 'The source has branching logic; verify each meaningful condition.'
    });
  }
  if (/\b(user|role|permission|auth|token|session)\b/i.test(sourceText)) {
    suggestions.push({
      title: 'Add authorization/session edge cases',
      reason: 'Auth or permission behavior is critical and should be covered explicitly.'
    });
  }
  return uniqueSuggestions(suggestions).slice(0, 8);
}

function uniqueSuggestions(suggestions: TestSuggestion[]): TestSuggestion[] {
  return [...new Map(suggestions.map((suggestion) => [suggestion.title, suggestion])).values()];
}

function buildPrompt(
  risk: SourceFileRisk,
  project: TestProject,
  sourceText: string,
  tests: Array<{ path: string; text: string; findings: QualityFinding[] }>
): string {
  return [
    `Project: ${project.label} (${project.framework})`,
    `Source: ${normalizePath(path.relative(project.rootPath, risk.path))}`,
    `Risk score: ${risk.score}`,
    `Criticality signals: ${risk.signals.join(', ') || 'none'}`,
    `Coverage: ${risk.coverage?.linesPct ?? 'unknown'}`,
    '',
    'Static findings:',
    ...risk.findings.map((finding) => `- ${finding.kind}: ${finding.message}`),
    '',
    'Source code:',
    fenced(sourceText),
    '',
    'Related tests:',
    ...(tests.length
      ? tests.flatMap((test) => [
          `Test: ${normalizePath(path.relative(project.rootPath, test.path))}`,
          `Known test smells: ${test.findings.map((finding) => `${finding.kind}: ${finding.message}`).join('; ') || 'none'}`,
          fenced(test.text)
        ])
      : ['No related tests found.']),
    '',
    'Return markdown with these sections: Verdict, What is covered, Missing or weak tests, Edge cases to add, Suggested test cases.'
  ].join('\n');
}

function fenced(text: string): string {
  return ['```', text, '```'].join('\n');
}

async function readLimited(filePath: string, maxChars: number): Promise<string> {
  const text = await fs.readFile(filePath, 'utf8').catch(() => '');
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n/* truncated by Test Inspector */`;
}

export function findRiskForFile(filePath: string, risks: SourceFileRisk[]): SourceFileRisk | undefined {
  const normalized = normalizePath(filePath);
  return risks.find((risk) => normalizePath(risk.path) === normalized || basenameWithoutKnownExtensions(risk.path) === basenameWithoutKnownExtensions(filePath));
}
