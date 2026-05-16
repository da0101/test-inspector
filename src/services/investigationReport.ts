import * as path from 'path';
import { FeatureInvestigationReport, InvestigationReport } from '../models';

export function renderInvestigationMarkdown(report: InvestigationReport): string {
  return [
    `# Test Investigation: ${path.basename(report.sourcePath)}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    `- Source: \`${report.sourcePath}\``,
    `- Risk score: ${report.riskScore}`,
    `- Criticality: ${report.criticality}`,
    `- Coverage: ${report.coverage?.linesPct === undefined ? 'unknown' : `${report.coverage.linesPct}%`}`,
    `- Related tests: ${report.relatedTests.length}`,
    '',
    '## Signals',
    ...(report.signals.length ? report.signals.map((signal) => `- ${signal}`) : ['- None detected']),
    '',
    '## Static Source Summary',
    ...report.sourceSummary.map((item) => `- ${item}`),
    '',
    '## Known Findings',
    ...[...report.deterministicFindings, ...report.weakTestFindings].map(
      (finding) => `- ${finding.severity}: ${finding.kind} in \`${finding.filePath}${finding.line ? `:${finding.line}` : ''}\`: ${finding.message}`
    ),
    ...(!report.deterministicFindings.length && !report.weakTestFindings.length ? ['- None'] : []),
    '',
    '## Related Tests',
    ...(report.relatedTests.length ? report.relatedTests.map((testPath) => `- \`${testPath}\``) : ['- None found']),
    '',
    '## Suggested Tests',
    ...report.suggestedTests.map((suggestion) => `- ${suggestion.title}: ${suggestion.reason}`),
    ...(!report.suggestedTests.length ? ['- None from deterministic analysis'] : []),
    '',
    '## LLM Investigator',
    report.llmEnabled ? report.llmSummary || 'No LLM content returned.' : 'LLM was not used for this investigation.',
    ''
  ].join('\n');
}

export function renderFeatureInvestigationMarkdown(report: FeatureInvestigationReport): string {
  return [
    `# Feature Investigation: ${report.feature.label}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    `- Project: ${report.project.label}`,
    `- Feature root: \`${report.feature.rootPath}\``,
    `- Risk score: ${report.feature.riskScore}`,
    `- Average coverage: ${report.feature.averageCoverage === undefined ? 'unknown' : `${report.feature.averageCoverage}%`}`,
    `- Source files: ${report.feature.sourceFiles.length}`,
    `- Test files: ${report.feature.testFiles.length}`,
    `- Targeted command: \`${report.feature.recommendedCommand ?? 'none'}\``,
    '',
    '## Signals',
    ...(report.feature.signals.length ? report.feature.signals.map((signal) => `- ${signal}`) : ['- None detected']),
    '',
    '## Top Risky Files',
    ...(report.risks.length
      ? report.risks.map((risk) => `- \`${risk.path}\`: risk ${risk.score}, coverage ${risk.coverage?.linesPct ?? 'unknown'}; ${risk.recommendation}`)
      : ['- None detected']),
    '',
    '## Weak Test Findings',
    ...(report.weakFindings.length
      ? report.weakFindings.map((finding) => `- ${finding.kind} in \`${finding.filePath}${finding.line ? `:${finding.line}` : ''}\`: ${finding.message}`)
      : ['- None detected']),
    '',
    '## Suggested Feature Tests',
    ...(report.suggestedTests.length ? report.suggestedTests.map((suggestion) => `- ${suggestion.title}: ${suggestion.reason}`) : ['- None']),
    '',
    '## LLM Feature Investigator',
    report.llmEnabled ? report.llmSummary || 'No LLM content returned.' : 'LLM was not used for this feature investigation.',
    ''
  ].join('\n');
}
