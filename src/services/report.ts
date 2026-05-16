import * as path from 'path';
import { ChangedFileRisk, CoverageSummary, QualityFinding, TestFile, TestInspectorReport, TestProject } from '../models';

export function buildReport(
  projects: TestProject[],
  testFiles: TestFile[],
  coverage: CoverageSummary[],
  changedFiles: ChangedFileRisk[]
): TestInspectorReport {
  return {
    generatedAt: new Date().toISOString(),
    projects,
    testFiles,
    coverage,
    qualityFindings: testFiles.flatMap((testFile) => testFile.qualityFindings),
    changedFiles
  };
}

export function renderMarkdownReport(report: TestInspectorReport): string {
  const cases = report.testFiles.flatMap((file) => file.testCases);
  const coveragePct = average(report.coverage.map((summary) => summary.totals.linesPct));
  const findings = report.qualityFindings;
  const changedRows = report.changedFiles.map((risk) => {
    const coverage = risk.coverage?.linesPct === undefined ? 'unknown' : `${risk.coverage.linesPct}%`;
    return `| ${rel(risk.path)} | ${risk.relatedTests.length} | ${coverage} | ${risk.findings.map((finding) => finding.kind).join(', ') || '-'} |`;
  });

  return [
    '# Test Inspector Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    `- Projects detected: ${report.projects.length}`,
    `- Test files: ${report.testFiles.length}`,
    `- Test cases: ${cases.length}`,
    `- Passing: ${cases.filter((testCase) => testCase.status === 'passed').length}`,
    `- Failing: ${cases.filter((testCase) => testCase.status === 'failed').length}`,
    `- Skipped: ${cases.filter((testCase) => testCase.status === 'skipped').length}`,
    `- Coverage: ${coveragePct === undefined ? 'unknown' : `${coveragePct}% lines`}`,
    '',
    '## Changed Files Risk',
    '| File | Related Tests | Coverage | Findings |',
    '|---|---:|---:|---|',
    ...(changedRows.length ? changedRows : ['| - | 0 | unknown | - |']),
    '',
    '## Quality Findings',
    ...(findings.length ? findings.map(formatFinding) : ['- None']),
    '',
    '## Recommended Commands',
    '```bash',
    ...unique(report.changedFiles.map((risk) => risk.recommendedCommand).filter((command): command is string => Boolean(command))),
    '```',
    ''
  ].join('\n');
}

function formatFinding(finding: QualityFinding): string {
  const line = finding.line ? `:${finding.line}` : '';
  return `- ${finding.severity}: \`${rel(finding.filePath)}${line}\` ${finding.message}`;
}

function average(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => typeof value === 'number');
  if (!present.length) {
    return undefined;
  }
  return Math.round((present.reduce((sum, value) => sum + value, 0) / present.length) * 10) / 10;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function rel(filePath: string): string {
  return filePath.split(path.sep).join('/');
}
