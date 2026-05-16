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

const FRAMEWORK_LABEL: Record<string, string> = {
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
  lines.push('');
  return lines.join('\n');
}

export function exportCaseFileAsMarkdown(bundle: CaseFileBundle): string {
  const projectMap = new Map<string, TestProject>(
    (bundle.projects ?? []).map((p) => [p.id, p]),
  );
  const lines: string[] = [];

  lines.push('# Test Inspector — Case File');
  lines.push('');
  lines.push(`_Generated: ${new Date(bundle.scanTimestamp).toISOString()}_`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  for (const v of VERDICT_ORDER) {
    lines.push(`- **${VERDICT_HEADER[v]}**: ${bundle.totals[v] ?? 0}`);
  }
  if (bundle.projects && bundle.projects.length > 1) {
    lines.push('');
    lines.push('### Projects scanned');
    lines.push('');
    for (const p of bundle.projects) {
      const fwLabel = FRAMEWORK_LABEL[p.framework] ?? p.framework;
      const count = bundle.cases.filter((c) => c.target.projectId === p.id).length;
      lines.push(`- **${p.label}** (${fwLabel}) — ${count} case(s)`);
    }
  }
  lines.push('');

  for (const verdict of VERDICT_ORDER) {
    const cases = bundle.cases.filter((c) => c.verdict === verdict);
    if (cases.length === 0) continue;
    lines.push(`## ${VERDICT_HEADER[verdict]} (${cases.length})`);
    lines.push('');
    for (const c of cases) {
      lines.push(renderCase(c, projectMap.get(c.target.projectId)));
    }
  }

  lines.push('---');
  lines.push('_Test Inspector is a local-first detective for unit tests. The tool only informs — you fix and rescan._');

  return lines.join('\n');
}
