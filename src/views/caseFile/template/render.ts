import * as path from 'node:path';
import type { TestProject } from '../../../models';
import type { CaseFile, CaseFileAiReview, CaseVerdict } from '../../../services/caseFile';
import { escapeHtml, VERDICT_BLURB, VERDICT_LABEL, frameworkLabel } from './constants';
import { ICONS, frameworkIcon } from './icons';

export function projectsById(projects: TestProject[] | undefined): Map<string, TestProject> {
  const map = new Map<string, TestProject>();
  for (const p of projects ?? []) map.set(p.id, p);
  return map;
}

export function relativePath(absolutePath: string, project: TestProject | undefined): string {
  if (!project) return path.basename(absolutePath);
  const root = project.rootPath.replace(/\/+$/, '');
  const prefix = `${root}/`;
  return absolutePath.startsWith(prefix) ? absolutePath.slice(prefix.length) : path.basename(absolutePath);
}

export function renderKpiTile(verdict: CaseVerdict, count: number, total: number): string {
  const share = total > 0 ? Math.round((count / total) * 100) : 0;
  const label = verdict === 'STRONG'
    ? 'Strong test files'
    : verdict === 'MISSING'
      ? 'Missing source files'
      : `${VERDICT_LABEL[verdict]} case cards`;
  const tooltip = verdict === 'THEATER'
    ? 'Test files that appear to pass without proving real behavior, such as trivial or self-mocking tests.'
    : verdict === 'WEAK'
      ? 'Test files with weak quality signals, such as shallow assertions or unclear behavior coverage.'
      : verdict === 'MISSING'
        ? 'Critical source files where Test Inspector found no related test evidence or effectively no coverage.'
        : verdict === 'STRONG'
          ? 'Test files with no static theater or weak-test signals. This is file quality, not executed test-case count.'
          : VERDICT_BLURB[verdict];
  return `
    <button class="kpi" data-verdict="${escapeHtml(verdict)}" data-blurb="${escapeHtml(VERDICT_BLURB[verdict])}" title="${escapeHtml(tooltip)}" aria-label="Filter to ${label}. ${tooltip}">
      <span class="kpi-icon kpi-icon--${verdict.toLowerCase()}">${ICONS[verdict]}</span>
      <span class="kpi-body">
        <span class="kpi-value" data-count>${count}</span>
        <span class="kpi-label">${escapeHtml(label)}</span>
        <span class="kpi-blurb">
          <span class="kpi-blurb-text">${VERDICT_BLURB[verdict]}</span>
          <span class="kpi-blurb-sep" data-sep>${total > 0 ? '·' : ''}</span>
          <span class="kpi-blurb-pct" data-pct>${total > 0 ? share + '% of cards' : ''}</span>
        </span>
      </span>
    </button>
  `;
}

export function renderTab(opts: { projectId: string; label: string; count: number; framework?: string; active: boolean }): string {
  const icon = opts.framework ? frameworkIcon(opts.framework) : '';
  return `
    <button class="tab${opts.active ? ' active' : ''}" data-project="${escapeHtml(opts.projectId)}" role="tab" aria-selected="${opts.active}">
      ${icon ? `<span class="tab-icon">${icon}</span>` : ''}
      <span>${escapeHtml(opts.label)}</span>
      <em>${opts.count}</em>
    </button>
  `;
}

function renderSignal(s: { name: string; weight: number; detail?: string; location?: { file: string; line?: number } }): string {
  const detail = s.detail ? `<span class="signal-detail">${escapeHtml(s.detail)}</span>` : '';
  const loc = s.location
    ? `<span class="signal-loc">${escapeHtml(path.basename(s.location.file))}${s.location.line !== undefined ? ':' + s.location.line : ''}</span>`
    : '';
  return `
    <li class="signal">
      <span class="signal-row">
        <code class="signal-name">${escapeHtml(s.name)}</code>
        <span class="signal-weight">+${s.weight}</span>
        ${loc}
      </span>
      ${detail}
    </li>
  `;
}

export function renderAiReview(review: CaseFileAiReview | undefined): string {
  if (!review) return '';
  if (review.status === 'error') {
    return `
      <section class="ai-review ai-review--error">
        <div class="ai-review-title">AI reviewer could not validate this case</div>
        <p>${escapeHtml(review.error)}</p>
      </section>
    `;
  }

  const anchors = review.evidenceAnchors.length
    ? `<ol class="ai-anchors">
        ${review.evidenceAnchors
          .map(
            (anchor) => `<li>
              <span class="ai-line">line ${anchor.lineNumber}</span>
              <code>${escapeHtml(anchor.excerpt)}</code>
              <span>${escapeHtml(anchor.issue)}</span>
            </li>`,
          )
          .join('')}
      </ol>`
    : '<p class="muted">No verified line anchors were returned. Treat this as advisory only.</p>';

  const uncertainty = review.uncertaintyNotes
    ? `<p class="ai-uncertainty">${escapeHtml(review.uncertaintyNotes)}</p>`
    : '';
  const dropped = review.droppedAnchors > 0
    ? `<p class="muted">${review.droppedAnchors} unverified anchor${review.droppedAnchors === 1 ? '' : 's'} dropped before display.</p>`
    : '';
  const pseudocode = review.suggestedFix.pseudocode
    ? `<pre class="ai-code"><code>${escapeHtml(review.suggestedFix.pseudocode)}</code></pre>`
    : '';

  return `
    <section class="ai-review ai-review--${review.status}">
      <div class="ai-review-title">
        AI reviewer: ${review.status === 'accepted' ? 'verdict supported by evidence' : 'verdict challenged'}
        <span>${escapeHtml(review.provider)} · ${escapeHtml(review.model)}</span>
      </div>
      <p>${escapeHtml(review.explanation)}</p>
      ${anchors}
      <div class="ai-fix"><strong>Suggested fix:</strong> ${escapeHtml(review.suggestedFix.summary)}</div>
      ${pseudocode}
      ${uncertainty}
      ${dropped}
    </section>
  `;
}

function renderTestGaps(c: CaseFile): string {
  const gaps = c.evidence.gaps ?? [];
  if (gaps.length === 0) return '';
  return `
    <section class="case-gaps" aria-label="Suggested test gaps">
      <div class="case-gaps-title">Suggested test gaps</div>
      <ul>
        ${gaps.map((gap) => `
          <li>
            <span class="gap-severity gap-severity--${escapeHtml(gap.severity)}">${escapeHtml(gap.severity)}</span>
            <strong>${escapeHtml(gap.title)}</strong>
            <span>${escapeHtml(gap.reason)}</span>
            <em>${escapeHtml(gap.suggestedTest)}</em>
          </li>
        `).join('')}
      </ul>
    </section>
  `;
}

export function renderCase(c: CaseFile, project: TestProject | undefined): string {
  const rel = relativePath(c.target.path, project);
  const projectLabel = project ? project.label || project.id : c.target.projectId;
  const projectFramework = project?.framework;
  const icon = frameworkIcon(projectFramework);
  const hasEvidence = c.evidence.signals.length > 0;
  return `
    <article class="case" data-verdict="${escapeHtml(c.verdict)}" data-project="${escapeHtml(c.target.projectId)}">
      <header>
        <span class="badge badge--${c.verdict.toLowerCase()}" aria-label="${VERDICT_LABEL[c.verdict]} verdict">
          ${ICONS[c.verdict]}
          <span>${escapeHtml(VERDICT_LABEL[c.verdict])}</span>
        </span>
        <span class="project-chip" title="${escapeHtml(frameworkLabel(projectFramework))}">
          ${icon}
          <span>${escapeHtml(projectLabel)}</span>
        </span>
        <span class="path" title="${escapeHtml(c.target.path)}">${escapeHtml(rel)}</span>
      </header>
      <h3>${escapeHtml(c.story.headline)}</h3>
      <p>${escapeHtml(c.story.paragraph)}</p>
      ${renderTestGaps(c)}
      ${hasEvidence ? `
        <section class="case-evidence" hidden>
          <div class="evidence-title">Evidence — ${c.evidence.signals.length} signal${c.evidence.signals.length === 1 ? '' : 's'}</div>
          <ul class="signal-list">
            ${c.evidence.signals.map(renderSignal).join('')}
          </ul>
        </section>
      ` : ''}
      ${renderAiReview(c.aiReview)}
      <footer>
        <button class="btn primary" data-cmd="open" data-path="${escapeHtml(c.target.path)}">Open file</button>
        <button class="btn" data-cmd="copy" data-text="${escapeHtml(c.suggestion.text)}">Copy suggestion</button>
        <button class="btn" data-cmd="aiReview" data-path="${escapeHtml(c.target.path)}">Ask AI reviewer</button>
        ${hasEvidence ? `<button class="btn" data-cmd="evidence">Show evidence</button>` : ''}
        <button class="btn ghost" data-cmd="rescan" aria-label="Refresh the current Case File target">Refresh Case File</button>
        <button class="btn ghost" data-cmd="review" data-path="${escapeHtml(c.target.path)}" aria-label="Mark this case as reviewed and hide it until the file changes">Mark reviewed</button>
      </footer>
    </article>
  `;
}
