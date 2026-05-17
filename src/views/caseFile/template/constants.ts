import type { CaseVerdict } from '../../../services/caseFile';

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);
}

export const VERDICT_LABEL: Record<CaseVerdict, string> = {
  THEATER: 'Theater',
  WEAK: 'Weak',
  MISSING: 'Missing',
  STRONG: 'Strong',
  OK: 'OK',
};

export const VERDICT_ORDER: CaseVerdict[] = ['THEATER', 'WEAK', 'MISSING', 'STRONG'];

export const VERDICT_BLURB: Record<CaseVerdict, string> = {
  THEATER: 'pass without proving anything',
  WEAK: 'one weak signal each',
  MISSING: 'critical code with no tests',
  STRONG: 'doing their job',
  OK: 'no issues',
};

export function frameworkLabel(framework: string | undefined): string {
  switch (framework) {
    case 'node': return 'Node.js';
    case 'flutter': return 'Flutter';
    case 'react': return 'React';
    case 'vue': return 'Vue';
    case 'django': return 'Django';
    case 'fastapi': return 'FastAPI';
    case 'firebase-functions': return 'Firebase Functions';
    default: return framework ?? 'Project';
  }
}
