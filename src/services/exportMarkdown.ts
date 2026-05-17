import * as path from 'node:path';
import type { TestProject } from '../models';
import type { CaseFile, CaseFileBundle, CaseVerdict } from './caseFile';

const VERDICT_HEADER: Record<CaseVerdict, string> = {
  THEATER: '🔴 Theater',
  WEAK: '🟡 Weak',
  MISSING: '⚪ Missing',
  STRONG: '🟢 Strong',
  OK: 'OK',
};

const VERDICT_ORDER: CaseVerdict[] = ['THEATER', 'WEAK', 'MISSING', 'STRONG'];

export type CaseFileReportMode = 'deterministic' | 'ai';

export type CaseFileReportOptions = {
  mode?: CaseFileReportMode;
  verdicts?: CaseVerdict[];
  aiErrors?: string[];
};

const FRAMEWORK_LABEL: Record<string, string> = {
  node: 'Node.js',
  flutter: 'Flutter',
  react: 'React',
  vue: 'Vue',
  django: 'Django',
  fastapi: 'FastAPI',
  'firebase-functions': 'Firebase Functions',
};

function relativePath(absolutePath: string, project: TestProject | undefined): string {
  if (!project) return path.basename(absolutePath);
  const root = project.rootPath.replace(/\/+$/, '');
  const prefix = `${root}/`;
  return absolutePath.startsWith(prefix) ? absolutePath.slice(prefix.length) : path.basename(absolutePath);
}

function renderCase(c: CaseFile, project: TestProject | undefined): string {
  const rel = relativePath(c.target.path, project);
  const lines: string[] = [];
  lines.push(`### \`${rel}\``);
  if (project) {
    const fwLabel = FRAMEWORK_LABEL[project.framework] ?? project.framework;
    lines.push(`- **Project:** ${project.label} (${fwLabel})`);
  }
  lines.push(`- **Headline:** ${c.story.headline}`);
  lines.push(`- **Why:** ${c.story.paragraph}`);
  lines.push(`- **Suggestion:** ${c.suggestion.text}`);
  if (c.evidence.signals.length > 0) {
    lines.push('- **Evidence:**');
    for (const s of c.evidence.signals) {
      const detail = s.detail ? ` — ${s.detail}` : '';
      const loc = s.location ? ` _(${path.basename(s.location.file)}${s.location.line !== undefined ? ':' + s.location.line : ''})_` : '';
      lines.push(`  - \`${s.name}\` (weight ${s.weight})${detail}${loc}`);
    }
  }
  if (c.evidence.gaps?.length) {
    lines.push('- **Suggested test gaps:**');
    for (const gap of c.evidence.gaps) {
      lines.push(`  - **${gap.severity.toUpperCase()}** ${gap.title} — ${gap.reason}`);
      lines.push(`    - Suggested test: ${gap.suggestedTest}`);
      if (gap.evidence.length > 0) {
        lines.push(`    - Evidence: ${gap.evidence.join('; ')}`);
      }
    }
  }
  if (c.aiReview) {
    lines.push('- **AI review:**');
    if (c.aiReview.status === 'error') {
      lines.push(`  - Error: ${c.aiReview.error}`);
    } else {
      lines.push(`  - ${c.aiReview.provider} / ${c.aiReview.model}: ${c.aiReview.status}`);
      lines.push(`  - Explanation: ${c.aiReview.explanation}`);
      lines.push(`  - Suggested fix: ${c.aiReview.suggestedFix.summary}`);
      if (c.aiReview.suggestedFix.pseudocode) {
        lines.push('  - Pseudocode:');
        lines.push('```');
        lines.push(c.aiReview.suggestedFix.pseudocode);
        lines.push('```');
      }
      if (c.aiReview.evidenceAnchors.length > 0) {
        lines.push('  - Verified anchors:');
        for (const anchor of c.aiReview.evidenceAnchors) {
          lines.push(`    - Line ${anchor.lineNumber}: ${anchor.issue} — \`${anchor.excerpt}\``);
        }
      }
      if (c.aiReview.uncertaintyNotes) {
        lines.push(`  - Uncertainty: ${c.aiReview.uncertaintyNotes}`);
      }
    }
  }
  lines.push('');
  return lines.join('\n');
}

export function exportCaseFileAsMarkdown(bundle: CaseFileBundle, options: CaseFileReportOptions = {}): string {
  const projectMap = new Map<string, TestProject>(
    (bundle.projects ?? []).map((p) => [p.id, p]),
  );
  const selected = selectCases(bundle, options.verdicts);
  const totals = recountTotals(selected);
  const lines: string[] = [];

  lines.push(options.mode === 'ai' ? '# Test Inspector — AI Optimized Report' : '# Test Inspector — Deterministic Report');
  lines.push('');
  lines.push(`_Generated: ${new Date(bundle.scanTimestamp).toISOString()}_`);
  lines.push(`_Mode: ${options.mode === 'ai' ? 'AI optimized, deterministic scores preserved' : 'Deterministic'}_`);
  lines.push('');
  if (bundle.scope) {
    lines.push('## Scope');
    lines.push('');
    if (bundle.scope.repoName) lines.push(`- **Repository:** ${bundle.scope.repoName}`);
    if (bundle.scope.worktreePath) lines.push(`- **Worktree:** \`${bundle.scope.worktreePath}\``);
    if (bundle.scope.branch) lines.push(`- **Branch:** \`${bundle.scope.branch}\``);
    if (bundle.scope.featureLabel) lines.push(`- **Feature:** ${bundle.scope.featureLabel}`);
    lines.push('');
  }

  lines.push('## Summary');
  lines.push('');
  if (options.verdicts?.length) {
    lines.push(`- **Included groups:** ${options.verdicts.map((v) => VERDICT_HEADER[v]).join(', ')}`);
  } else {
    lines.push('- **Included groups:** All');
  }
  lines.push(`- **Projects detected:** ${(bundle.projects ?? []).length}`);
  lines.push(`- **Test files:** ${(bundle.testFiles ?? []).length}`);
  lines.push(`- **Test cases discovered:** ${(bundle.testFiles ?? []).reduce((sum, file) => sum + file.testCases.length, 0)}`);
  if (bundle.runtime?.passed !== undefined) {
    lines.push(`- **Runtime test result:** ${bundle.runtime.passed}/${bundle.runtime.testCases} passing`);
  }
  lines.push(`- **Coverage summaries:** ${(bundle.coverage ?? []).length}`);
  const lineCoverage = average((bundle.coverage ?? []).map((summary) => summary.totals.linesPct).filter((v): v is number => typeof v === 'number'));
  const branchCoverage = average((bundle.coverage ?? []).map((summary) => summary.totals.branchesPct).filter((v): v is number => typeof v === 'number'));
  const functionCoverage = average((bundle.coverage ?? []).map((summary) => summary.totals.functionsPct).filter((v): v is number => typeof v === 'number'));
  const statementCoverage = average((bundle.coverage ?? []).map((summary) => summary.totals.statementsPct).filter((v): v is number => typeof v === 'number'));
  if (lineCoverage !== undefined) {
    lines.push(`- **Average line coverage:** ${lineCoverage}%`);
  }
  if (branchCoverage !== undefined) lines.push(`- **Average branch coverage:** ${branchCoverage}%`);
  if (functionCoverage !== undefined) lines.push(`- **Average function coverage:** ${functionCoverage}%`);
  if (statementCoverage !== undefined) lines.push(`- **Average statement coverage:** ${statementCoverage}%`);
  for (const v of VERDICT_ORDER) {
    lines.push(`- **${VERDICT_HEADER[v]}**: ${totals[v] ?? 0}`);
  }
  if (options.aiErrors?.length) {
    lines.push(`- **AI review errors:** ${options.aiErrors.length}`);
  }
  if (bundle.projects && bundle.projects.length > 1) {
    lines.push('');
    lines.push('### Projects scanned');
    lines.push('');
    for (const p of bundle.projects) {
      const fwLabel = FRAMEWORK_LABEL[p.framework] ?? p.framework;
      const count = selected.filter((c) => c.target.projectId === p.id).length;
      lines.push(`- **${p.label}** (${fwLabel}) — ${count} case(s)`);
    }
  }
  if (bundle.coverage?.length) {
    lines.push('');
    lines.push('### Coverage by project');
    lines.push('');
    lines.push('| Project | Lines | Branches | Functions | Statements | Files |');
    lines.push('|---|---:|---:|---:|---:|---:|');
    for (const summary of bundle.coverage) {
      const project = projectMap.get(summary.projectId);
      lines.push([
        `| ${project?.label ?? summary.projectId}`,
        formatPct(summary.totals.linesPct),
        formatPct(summary.totals.branchesPct),
        formatPct(summary.totals.functionsPct),
        formatPct(summary.totals.statementsPct),
        String(summary.files.length)
      ].join(' | ') + ' |');
    }
  }
  lines.push('');

  for (const verdict of VERDICT_ORDER) {
    const cases = selected.filter((c) => c.verdict === verdict);
    if (cases.length === 0) continue;
    lines.push(`## ${VERDICT_HEADER[verdict]} (${cases.length})`);
    lines.push('');
    for (const c of cases) {
      lines.push(renderCase(c, projectMap.get(c.target.projectId)));
    }
  }

  if (options.aiErrors?.length) {
    lines.push('## AI Review Errors');
    lines.push('');
    for (const error of options.aiErrors) {
      lines.push(`- ${error}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('_Test Inspector is a local-first detective for unit tests. The tool only informs — you fix and rescan._');

  return lines.join('\n');
}

function formatPct(value: number | undefined): string {
  return value === undefined ? 'unknown' : `${value}%`;
}

function selectCases(bundle: CaseFileBundle, verdicts: CaseVerdict[] | undefined): CaseFile[] {
  if (!verdicts?.length) {
    return bundle.cases;
  }
  const allowed = new Set(verdicts);
  return bundle.cases.filter((c) => allowed.has(c.verdict));
}

function recountTotals(cases: CaseFile[]): Record<CaseVerdict, number> {
  const totals: Record<CaseVerdict, number> = { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 };
  for (const item of cases) totals[item.verdict] += 1;
  return totals;
}

function average(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}
